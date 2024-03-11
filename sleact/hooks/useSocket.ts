import io from 'socket.io-client';
import { useCallback } from "react";

const backUrl = 'http://localhost:3095';
const sockets: {[key: string]: SocketIOClient.Socket} = {};
const useSocket = (workspace?: string): [SocketIOClient.Socket | undefined, () => void] => {
    console.log('rerender', workspace)
    const disconnect = useCallback(() => {
        if (workspace) {
            sockets[workspace].disconnect();
            delete sockets[workspace];  // 연결 끊었는데 객체로 더이상 관리할 필요가 없음
        }
    }, []);
    if (!workspace){
        return[undefined, disconnect];
    }
    if (!sockets[workspace]) {
        sockets[workspace] = io.connect(`${backUrl}/ws-${workspace}`, {
            transports: ['websocket']
        });
    }

    return [sockets[workspace], disconnect];
}

export default useSocket;