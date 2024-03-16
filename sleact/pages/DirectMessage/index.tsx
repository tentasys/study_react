import React, {useCallback} from "react";
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
import {IDM} from "@typings/db";
import makeSection from "@utils/makeSection";

const DirectMessage = () => {
    const { workspace, id } = useParams<{ workspace: string, id: string }>();
    const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${id}`, fetcher);
    const { data: myData } = useSWR(`/api/users`, fetcher);
    const [chat, onChangeChat, setChat] = useInput('');

    // 채팅 받아오기
    const { data: chatData, mutate: mutateChat } = useSWR<IDM[]>(
        `/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=1`,
        fetcher,
    );

    // 채팅 등록하기
    const onSubmitform = useCallback((e) => {
        e.preventDefault();
        console.log(chat);
        if (chat?.trim()) {
            axios.post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
                content: chat,
            })
                .then(() => {
                    mutateChat();
                    setChat('');    // 채팅 입력한 뒤에 기존 채팅창에 있는 글자 지우기
                })
                .catch(console.error);
        }
    }, [chat])

    // 값이 없을 때 (로딩중일 때)는 화면 띄우지 않기
    if(!userData || !myData) {
        return null;
    }

    const chatSections = makeSection(chatData ? [...chatData].reverse() : [])

    return (<Container>
            <Header>
                <img src={gravatar.url(userData.email, {s: '24px', d:'retro'})} alt={userData.nickname} />
                <span>{userData.nickname}</span>
            </Header>
            <ChatList chatSections={chatSections}/>
            <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitform}/>
        </Container>
    );
}

export default DirectMessage