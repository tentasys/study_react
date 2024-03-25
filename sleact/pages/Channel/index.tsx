import React, {useCallback, useEffect, useRef, useState} from "react";
import {Container, DragOver, Header} from "@pages/Channel/styles";
import ChatBox from "@components/ChatBox";
import ChatList from "@components/ChatList";
import useInput from "@hooks/useInput";
import {useParams} from "react-router";
import useSWR from "swr";
import fetcher from "@utils/fetcher";
import useSWRInfinite from "swr/infinite";
import {IChannel, IChat, IUser} from "@typings/db";
import useSocket from "@hooks/useSocket";
import {Scrollbars} from "react-custom-scrollbars";
import axios from "axios";
import makeSection from "@utils/makeSection";
import InviteChannelModal from "@components/InviteChannelModal";
const Channel = () => {
    const { workspace, channel } = useParams<{ workspace: string, channel: string }>();
    const { data: myData } = useSWR(`/api/users`, fetcher);
    const [chat, onChangeChat, setChat] = useInput('');
    const { data: channelData } = useSWR<IChannel>(`/api/workspaces/${workspace}/channels/${channel}`, fetcher);
    // 채팅 받아오기
    const { data: chatData, mutate: mutateChat, setSize } = useSWRInfinite<IChat[]>(
        (index) => `/api/workspaces/${workspace}/channels/${channel}/chats?perPage=20&page=${index + 1}`,
        fetcher,
    );
    const {data: channelMembersData } = useSWR<IUser[]>(
        myData ? `/api/workspaces/${workspace}/channels/${channel}/members` : null,
        fetcher,
    );
    const [socket] = useSocket(workspace);
    const isEmpty = chatData?.[0]?.length === 0;
    const isReachingEnd = isEmpty || (chatData && chatData[chatData.length -1]?.length < 20) || false;
    const scrollbarRef = useRef<Scrollbars>(null);
    const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // 채팅 등록하기
    const onSubmitform = useCallback((e) => {
        e.preventDefault();
        console.log(chat);
        if (chat?.trim() && chatData && channelData) {
            const savedChat = chat;
            mutateChat((prevChatData) => {
                prevChatData?.[0].unshift({
                    id: (chatData[0][0]?.id || 0) + 1,
                    content :savedChat,
                    UserId: myData.id,
                    User: myData,
                    ChannelId: channelData.id,
                    Channel: channelData,
                    createdAt: new Date(),
                });
                return prevChatData;
            }, false)
                .then(() => {
                    setChat('');    // 채팅 입력한 뒤에 기존 채팅창에 있는 글자 지우기
                    scrollbarRef.current?.scrollToBottom();
                });
            axios.post(`/api/workspaces/${workspace}/channels/${channel}/chats`, {
                content: chat,
            })
                .then(() => {
                    mutateChat();
                })
                .catch(console.error);
        }
    }, [chat, chatData, myData, channelData, workspace, channel])

    const onMessage = useCallback((data: IChat) => {
        // id는 상대방 아이디
        if (data.Channel.name === channel && (data.content.startsWith('uploads\\') || data.UserId !== myData?.id)) { // 내 아이디가 아닌것에 대해서만 mutate
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
    }, [channel, myData]);

    useEffect(() => {
        socket?.on('message', onMessage);
        return () =>{
            socket?.off('message', onMessage);
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

    const onClickInviteChannel = useCallback(() => {
        setShowInviteChannelModal(true);
    }, []);

    const onCloseModal = useCallback(() => {
        setShowInviteChannelModal(false);
    }, []);

    const onChangeFile = useCallback((e) => {
      const formData = new FormData();
      if (e.target.files) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          console.log('... file[' + i + '].name = ' + file.name);
          formData.append('image', file);
        }
      }
      axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => {});
    }, []);

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
            axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => {
                setDragOver(false);
                mutateChat();
            })
        }, []
    );

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        console.log(e);
        setDragOver(true);
    }, [mutateChat, workspace, channel]);

    // 값이 없을 때 (로딩중일 때)는 화면 띄우지 않기
    if(!myData) {
        return null;
    }

    const chatSections = makeSection(chatData ? chatData.flat().reverse() : [])
    return (<Container onDrop={onDrop} onDragOver={onDragOver}>
            <Header>
                <span>#{channel}</span>
                <div className="header-right">
                    <span>{channelMembersData?.length}</span>
                    <button onClick={onClickInviteChannel}
                        className="c-button-unstyled p-ia__view_header__button"
                        aria-label="Add people to #react-native"
                        data-sk="tooltip_parent"
                        type="button"
                    >
                        <i className="c-icon p-ia__view_header__button_icon c-icon--add-user" aria-hidden="true" />
                    </button>
                </div>
            </Header>
            <ChatList chatSections={chatSections} scrollRef={scrollbarRef} setSize={setSize} isReachingEnd={isReachingEnd}/>
            <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitform}/>
            <InviteChannelModal show={showInviteChannelModal} onCloseModal={onCloseModal} setShowInviteChannelModal={setShowInviteChannelModal}></InviteChannelModal>
            <input type="file" multiple onChange={onChangeFile}/>
            {dragOver && <DragOver>업로드!</DragOver>}
        </Container>
    );
}

export default Channel