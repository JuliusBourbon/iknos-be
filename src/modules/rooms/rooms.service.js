import prisma from '../../config/db.js';
import { generateRoomCode } from '../../utils/generateRoomCode.js';
import env from '../../config/env.js';

async function createRoom(userId, { name }) {
    const ownedCount = await prisma.room.count({ where: { ownerId: userId } });
    const memberCount = await prisma.roomMember.count({
        where: { userId },
    });

    if (memberCount >= env.room.maxRoomPerUser) {
        throw { statusCode: 400, message: `Maksimal ${env.room.maxRoomPerUser} Room aktif per pengguna` };
    }

    let code;
    let isUnique = false;
    while (!isUnique) {
        code = generateRoomCode();
        const existing = await prisma.room.findUnique({ where: { code } });
        if (!existing) isUnique = true;
    }

    const room = await prisma.$transaction(async (tx) => {
        const newRoom = await tx.room.create({
            data: { name, code, ownerId: userId },
        });

        await tx.roomMember.create({
            data: { roomId: newRoom.id, userId },
        });

        return newRoom;
    });

    return room;
}

async function requestJoinRoom(userId, { code }) {
    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) throw { statusCode: 404, message: 'Room tidak ditemukan' };

    const existingMember = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: room.id, userId } },
    });
    if (existingMember) throw { statusCode: 409, message: 'Kamu sudah menjadi anggota Room ini' };

    const memberCount = await prisma.roomMember.count({ where: { roomId: room.id } });
    if (memberCount >= env.room.maxMemberPerRoom) {
        throw { statusCode: 400, message: `Room sudah penuh (maksimal ${env.room.maxMemberPerRoom} pengguna)` };
    }

    const userRoomCount = await prisma.roomMember.count({ where: { userId } });
    if (userRoomCount >= env.room.maxRoomPerUser) {
        throw { statusCode: 400, message: `Maksimal ${env.room.maxRoomPerUser} Room aktif per pengguna` };
    }

    const existingRequest = await prisma.roomJoinRequest.findUnique({
        where: { roomId_userId: { roomId: room.id, userId } },
    });

    if (existingRequest) {
        if (existingRequest.status === 'PENDING') {
            throw { statusCode: 409, message: 'Permintaan bergabung sudah dikirim, menunggu approval' };
        }
        const updated = await prisma.roomJoinRequest.update({
            where: { id: existingRequest.id },
            data: { status: 'PENDING' },
        });
        return updated;
    }

    const request = await prisma.roomJoinRequest.create({
        data: { roomId: room.id, userId, status: 'PENDING' },
    });

    return request;
}

async function listPendingRequests(userId, roomId) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw { statusCode: 404, message: 'Room tidak ditemukan' };
    if (room.ownerId !== userId) throw { statusCode: 403, message: 'Hanya owner yang bisa melihat permintaan bergabung' };

    return prisma.roomJoinRequest.findMany({
        where: { roomId, status: 'PENDING' },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
}

async function respondJoinRequest(userId, requestId, action) {
    const request = await prisma.roomJoinRequest.findUnique({
        where: { id: requestId },
        include: { room: true },
    });
    if (!request) throw { statusCode: 404, message: 'Permintaan tidak ditemukan' };
    if (request.room.ownerId !== userId) throw { statusCode: 403, message: 'Hanya owner yang bisa memproses permintaan ini' };
    if (request.status !== 'PENDING') throw { statusCode: 400, message: 'Permintaan sudah diproses sebelumnya' };

    if (action === 'approve') {
        const memberCount = await prisma.roomMember.count({ where: { roomId: request.roomId } });
        if (memberCount >= env.room.maxMemberPerRoom) {
            throw { statusCode: 400, message: 'Room sudah penuh' };
        }

        await prisma.$transaction([
            prisma.roomJoinRequest.update({ where: { id: requestId }, data: { status: 'APPROVED' } }),
            prisma.roomMember.create({ data: { roomId: request.roomId, userId: request.userId } }),
            prisma.room.update({ where: { id: request.roomId }, data: { emptiedAt: null } }),
        ]);

        return { status: 'APPROVED' };
    }

    if (action === 'reject') {
        await prisma.roomJoinRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
        return { status: 'REJECTED' };
    }

    throw { statusCode: 400, message: 'Action tidak valid' };
}

async function leaveRoom(userId, roomId) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw { statusCode: 404, message: 'Room tidak ditemukan' };

    const member = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw { statusCode: 404, message: 'Kamu bukan anggota Room ini' };

    await prisma.$transaction(async (tx) => {
        await tx.roomMember.delete({ where: { id: member.id } });

        const remainingMembers = await tx.roomMember.findMany({
            where: { roomId },
            orderBy: { joinedAt: 'asc' },
        });

        if (remainingMembers.length === 0) {
            await tx.room.update({ where: { id: roomId }, data: { emptiedAt: new Date() } });
        } else if (room.ownerId === userId) {
            const newOwner = remainingMembers[0];
            await tx.room.update({ where: { id: roomId }, data: { ownerId: newOwner.userId } });
        }
    });

    return { message: 'Berhasil keluar dari Room' };
}

async function listMyRooms(userId) {
    const memberships = await prisma.roomMember.findMany({
        where: { userId },
        include: {
            room: {
                include: {
                    _count: { select: { members: true } },
                },
            },
        },
    });

    return memberships.map((m) => ({
        roomId: m.room.id,
        name: m.room.name,
        code: m.room.code,
        isOwner: m.room.ownerId === userId,
        memberCount: m.room._count.members,
        isHidden: m.isHidden,
        joinedAt: m.joinedAt,
    }));
}

async function getRoomDetail(userId, roomId) {
    const member = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw { statusCode: 403, message: 'Kamu bukan anggota Room ini' };

    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
            members: {
                include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            },
        },
    });

    return room;
}

export {
    createRoom,
    requestJoinRoom,
    listPendingRequests,
    respondJoinRequest,
    leaveRoom,
    listMyRooms,
    getRoomDetail,
};