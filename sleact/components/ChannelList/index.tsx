// import useSocket from '@hooks/useSocket';
import { CollapseButton } from '@components/DMList/styles';
import { IChannel, IChat, IUser } from '@typings/db';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import useSWR from "swr";
import fetcher from "@utils/fetcher";
import EachChannel from "@components/EachChannel";

const ChannelList: FC = () => {
    const { workspace } = useParams<{ workspace?: string }>();
    const location = useLocation();
    // const [socket] = useSocket(workspace);
    const { data: userData, error, mutate } = useSWR<IUser>('/api/users', fetcher, {dedupingInterval: 2000,});
    const { data: channelData } = useSWR<IChannel[]>(
        userData ? `/api/workspaces/${workspace}/channels` : null, // 조건부 요청. 로그인한 상태일 때만 가져온다.
        fetcher);
    const [channelCollapse, setChannelCollapse] = useState(false);
    const [countList, setCountList] = useState<{[key:string]: number|undefined}>({});

    const toggleChannelCollapse = useCallback(() => {
        setChannelCollapse((prev) => !prev);
    }, []);

    const resetCount = useCallback(
        (id) => () => {
            setCountList((list) => {
                return {
                    ...list,
                    [id]: undefined,
                };
            });
        },
        [],
    );

    useEffect(() => {
        console.log('ChannelList: workspace 바뀌었다', workspace, location.pathname);
        setCountList({});
    }, [workspace, location]);

    const onMessage = (data: IChat) => {
        console.log('message 왔다', data);
        const mentions = data.content.match(/@\[(.+?)]\((\d)\)/g);
        if (mentions?.find((v) => v.match(/@\[(.+?)]\((\d)\)/)![2] === userData?.id.toString())) {
            return setCountList((list) => {
                return {
                    ...list,
                    [`c-${data.ChannelId}`]: (list[`c-${data.ChannelId}`] || 0) + 1,
                };
            });
        }
        setCountList((list) => {
            return {
                ...list,
                [`c-${data.ChannelId}`]: list[`c-${data.ChannelId}`] || 0,
            };
        });
    };

    return (
        <>
            <h2>
                <CollapseButton collapse={channelCollapse} onClick={toggleChannelCollapse}>
                    <i
                        className="c-icon p-channel_sidebar__section_heading_expand p-channel_sidebar__section_heading_expand--show_more_feature c-icon--caret-right c-icon--inherit c-icon--inline"
                        data-qa="channel-section-collapse"
                        aria-hidden="true"
                    />
                </CollapseButton>
                <span>Channels</span>
            </h2>
            <div>
                {!channelCollapse &&
                    channelData?.map((channel) => {
                        return <EachChannel channel={channel} key={channel.id}/>;
                    })}
            </div>
        </>
    );
};

export default ChannelList;
