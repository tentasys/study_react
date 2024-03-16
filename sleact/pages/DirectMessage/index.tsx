import React, {useCallback, useEffect, useRef} from "react";
import {Container, Header} from "@pages/DirectMessage/styles";
import gravatar from "gravatar";
import useSWR from "swr";
import fetcher from "@utils/fetcher";
import {useParams} from "react-router";
import ChatBox from "@components/ChatBox";
import ChatList from "@components/ChatList";
import useInput from "@hooks/useInput";
import axios from "axios";
import useSWRInfinite from "swr/infinite";
import {IDM, IUser} from "@typings/db";
import makeSection from "@utils/makeSection";
import {Scrollbars} from "react-custom-scrollbars";

const DirectMessage = () => {
    const { workspace, id } = useParams<{ workspace: string, id: string }>();
    const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${id}`, fetcher);
    const { data: myData } = useSWR(`/api/users`, fetcher);
    const [chat, onChangeChat, setChat] = useInput('');

    // 채팅 받아오기
    const { data: chatData, mutate: mutateChat, setSize } = useSWRInfinite<IDM[]>(
        (index) => `/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=${index + 1}`,
        fetcher,
    );

    const isEmpty = chatData?.[0]?.length === 0;
    const isReachingEnd = isEmpty || (chatData && chatData[chatData.length -1]?.length < 20) || false;
    const scrollbarRef = useRef<Scrollbars>(null);
    // 채팅 등록하기
    const onSubmitform = useCallback((e) => {
        e.preventDefault();
        console.log(chat);
        if (chat?.trim() && chatData) {
            const savedChat = chat;
            mutateChat((prevChatData) => {
                prevChatData?.[0].unshift({
                    id: (chatData[0][0]?.id || 0) + 1,
                    content :savedChat,
                    SenderId: myData.id,
                    Sender: myData,
                    ReceiverId: userData.id,
                    Receiver: userData,
                    createdAt: new Date(),
                });
                return prevChatData;
            }, false)
                .then(() => {
                    setChat('');    // 채팅 입력한 뒤에 기존 채팅창에 있는 글자 지우기
                    scrollbarRef.current?.scrollToBottom();
                });
            axios.post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
                content: chat,
            })
                .then(() => {
                    mutateChat();
                })
                .catch(console.error);
        }
    }, [chat, chatData, myData, userData, workspace, id])

    // 로딩 시 스크롤바 제일 아래로
    useEffect(() => {
        if (chatData?.length === 1) {
            scrollbarRef.current?.scrollToBottom();
        }
    }, [chatData])

    // 값이 없을 때 (로딩중일 때)는 화면 띄우지 않기
    if(!userData || !myData) {
        return null;
    }

    const chatSections = makeSection(chatData ? chatData.flat().reverse() : [])

    return (<Container>
            <Header>
                <img src={gravatar.url(userData.email, {s: '24px', d:'retro'})} alt={userData.nickname} />
                <span>{userData.nickname}</span>
            </Header>
            <ChatList chatSections={chatSections} scrollRef={scrollbarRef} setSize={setSize} isReachingEnd={isReachingEnd}/>
            <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitform}/>
        </Container>
    );
}

export default DirectMessage