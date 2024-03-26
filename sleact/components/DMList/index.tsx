import useSocket from '@hooks/useSocket';
import { IDM, IUser, IUserWithOnline } from '@typings/db';
import { CollapseButton } from '@components/DMList/styles';
import fetcher from '@utils/fetcher';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import useSWR from 'swr';
import EachDM from "@components/EachDM";

const DMList: FC = () => {
    // 라우터 파라미터(:workspace)
    const { workspace } = useParams<{ workspace?: string }>();
    const { data: userData, error, mutate } = useSWR<IUser>('/api/users', fetcher, {dedupingInterval: 2000,});
    // 워크스페이스에 참여한 멤버들 불러옴
    const { data: memberData } = useSWR<IUserWithOnline[]>(
        userData ? `/api/workspaces/${workspace}/members` : null,
        fetcher,
    );
    const [socket] = useSocket(workspace);
    const [channelCollapse, setChannelCollapse] = useState(false);  // collapsebutton에 대한 상태
    const [countList, setCountList] = useState<{ [key: string]: number } >({});
    const [onlineList, setOnlineList] = useState<number[]>([]);

    // collapse하는 기능
    const toggleChannelCollapse = useCallback(() => {
        setChannelCollapse((prev) => !prev);
    }, []);

    const resetCount = useCallback(
        (id) => () => {
            setCountList((list) => {
                return {
                    ...list,
                    [id]: 0,
                };
            });
        },
        [],
    );

    const onMessage = (data: IDM) => {
        console.log('dm왔다', data);
        setCountList((list) => {
            return {
                ...list,
                [data.SenderId]: list[data.SenderId] ? list[data.SenderId] + 1 : 1,
            };
        });
    };

    useEffect(() => {
        console.log('DMList: workspace 바뀌었다', workspace);
        setOnlineList([]);
        setCountList({});
    }, [workspace]);

    useEffect(() => {
        socket?.on('onlineList', (data: number[]) => {
            setOnlineList(data);
        });
        // socket?.on('dm', onMessage);
        // console.log('socket on dm', socket?.hasListeners('dm'), socket);
        return () => {
            // socket?.off('dm', onMessage);
            // console.log('socket off dm', socket?.hasListeners('dm'));
            socket?.off('onlineList');
        };
    }, [socket]);

    return (
        <>
            <h2>
                <CollapseButton collapse={channelCollapse} onClick={toggleChannelCollapse}>
                    <i
                        className="c-icon p-channel_sidebar__section_heading_expand c-icon--caret-right c-icon--inherit c-icon--inline"
                        data-qa="channel-section-collapse"
                        aria-hidden="true"
                    />
                </CollapseButton>
                <span>Direct Messages</span>
            </h2>
            <div>
                {!channelCollapse &&
                    // 워크스페이스에 참여한 멤버 데이터를 불러와서 반복문을 돈다.
                    memberData?.map((member) => {
                        const isOnline = onlineList.includes(member.id);
                        return <EachDM member={member} isOnline={isOnline} key={member.id} />;
                    })}
            </div>
        </>
    );
};

export default DMList;
