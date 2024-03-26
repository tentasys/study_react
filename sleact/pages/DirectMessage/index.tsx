import React, {useCallback, useEffect, useRef, useState} from "react";
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
import {Scrollbars} from "react-custom-scrollbars";
import useSocket from "@hooks/useSocket";
import {DragOver} from "@pages/DirectMessage/styles";

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
    const [socket] = useSocket(workspace);
    const isEmpty = chatData?.[0]?.length === 0;
    const isReachingEnd = isEmpty || (chatData && chatData[chatData.length -1]?.length < 20) || false;
    const scrollbarRef = useRef<Scrollbars>(null);
    const [dragOver, setDragOver] = useState(false);

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
                    localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
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

    const onMessage = useCallback((data: IDM) => {
        // id는 상대방 아이디
        if (data.SenderId === Number(id) && myData.id !== Number(id)) { // 내 아이디가 아닌것에 대해서만 mutate
            // 가장 최근 데이터 가져온다
            mutateChat((chatData) => {
                chatData?.[0].unshift(data);
                return chatData;
            }, false).then(() => {
                // 스크롤바 고정
                // 내가 보내는 채팅 -> 스크롤바가 아래로 붙는다.
                // 남이 보내는 채팅 -> 스크롤바가 아래로 붙지 않도록 스크롤바 고정 처리
                if (scrollbarRef.current) {
                    if (
                        scrollbarRef.current.getScrollHeight() <
                        scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150  // 내가 150픽셀 이상으로 쳤을 때는 스크롤바가 내려가지 않도록 함
                    ) {
                        console.log('scrollToBottom!', scrollbarRef.current?.getValues());
                        setTimeout(() => {
                            scrollbarRef.current?.scrollToBottom();
                        }, 50);
                    }
                }
            });
        }
    }, []);

    useEffect(() => {
        socket?.on('dm', onMessage);
        return () =>{
            socket?.off('dm', onMessage);
        }
    }, [socket, onMessage]);

    // 로딩 시 스크롤바 제일 아래로
    useEffect(() => {
        if (chatData?.length === 1) {
            setTimeout(() => {
                scrollbarRef.current?.scrollToBottom();
            }, 100);
        }
    }, [chatData]);

    useEffect(() => {
        localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
    }, [workspace, id]);

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            console.log(e);
            const formData = new FormData();
            if (e.dataTransfer.items) {
                // use DataTransferItemList interface to access the file(s)
                for(let i= 0; i<e.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if(e.dataTransfer.items[i].kind === 'file') {
                        const file = e.dataTransfer.items[i].getAsFile();
                        console.log('...file['+i+'].name = '+file.name);
                        formData.append('image', file);
                    }
                }
            } else {
                // use Datatransfer interface to access the file(s)
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    console.log('...file['+i+'].name = '+e.dataTransfer.files[i].name);
                    formData.append('image', e.dataTransfer.files[i]);
                }
            }
            axios.post(`/api/workspaces/${workspace}/dms/${id}/images`, formData).then(() => {
                setDragOver(false);
                localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
                mutateChat();
            })
        }, []
    );

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        console.log(e);
        setDragOver(true);
    }, [mutateChat, workspace, id]);

    // 값이 없을 때 (로딩중일 때)는 화면 띄우지 않기
    if(!userData || !myData) {
        return null;
    }

    const chatSections = makeSection(chatData ? chatData.flat().reverse() : [])

    return (<Container onDrop={onDrop} onDragOver={onDragOver}>
            <Header>
                <img src={gravatar.url(userData.email, {s: '24px', d:'retro'})} alt={userData.nickname} />
                <span>{userData.nickname}</span>
            </Header>
            <ChatList chatSections={chatSections} scrollRef={scrollbarRef} setSize={setSize} isReachingEnd={isReachingEnd}/>
            <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitform}/>
            {dragOver && <DragOver>업로드!</DragOver>}
        </Container>
    );
}

export default DirectMessage