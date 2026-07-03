import { io } from 'socket.io-client';

// Isi JWT token
const token = '';
// Isi Room Id
const roomId = '';

const socket = io('http://localhost:3000', {
    auth: { token },
});

socket.on('connect', () => {
    console.log('Connected:', socket.id);

    socket.emit('join_room', { roomId }, (res) => {
        console.log('join_room response:', res);
    });
});

socket.on('location_broadcast', (data) => {
    console.log('Menerima broadcast lokasi:', data);
});

socket.on('user_online', (data) => console.log('User online:', data));
socket.on('user_offline', (data) => console.log('User offline:', data));
socket.on('user_visibility_changed', (data) => console.log('Visibility changed:', data));

// Simulasi kirim lokasi tiap 10 detik
setInterval(() => {
    socket.emit(
        'location_update',
        { roomId, lat: -6.9147 + Math.random() * 0.01, lng: 107.6098 + Math.random() * 0.01 },
        (res) => console.log('location_update response:', res)
    );
}, 10_000);