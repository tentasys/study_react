import React, {FC, useCallback, useEffect, useState, VFC} from "react";
import useSWR from "swr";
import fetcher from "@utils/fetcher";
import axios from "axios";
import {Redirect, useParams} from "react-router";
import {
    AddButton,
    Channels,
    Chats,
    Header, LogOutButton, MenuScroll,
    ProfileImg, ProfileModal,
    RightMenu, WorkspaceButton, WorkspaceModal,
    WorkspaceName,
    Workspaces,
    WorkspaceWrapper
} from "@layouts/Workspace/styles";
import gravatar from 'gravatar'
import {Link, Route, Switch} from "react-router-dom";
import loadable from "@loadable/component";
import Menu from "@components/Menu";
import {IChannel, IUser} from "@typings/db";
import {Button, Input, Label} from "@pages/SignUp/styles";
import useInput from "@hooks/useInput";
import Modal from "@components/Modal";
import {toast} from "react-toastify";
import CreateChannelModal from "@components/CreateChannelModal";
import InviteWorkspaceModal from "@components/InviteWorkspaceModal";
import InviteChannelModal from "@components/InviteChannelModal";
import DMList from "@components/DMList";
import ChannelList from "@components/ChannelList";
import useSocket from "@hooks/useSocket";

const Channel = loadable(() => import('@pages/Channel'))
const DirectMessage = loadable(() => import('@pages/DirectMessage'))

const Workspace: VFC = () => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
    const [showInviteWorkspaceModal, setShowInviteWorkspaceModal] = useState(false);
    const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
    const [newWorkspace, onChangeNewWorkspace, setNewWorkspace] = useInput('');
    const [newUrl, onChangeNewUrl, setNewUrl] = useInput('');
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);

    const { workspace } = useParams<{ workspace: string}>();
    // 유저 데이터
    const { data: userData, error, mutate } = useSWR<IUser | false>('/api/users', fetcher, {dedupingInterval: 2000,});
    // 채널 데이터를 서버로부터 받아오기
    const { data: channelData } = useSWR<IChannel[]>(
        userData ? `/api/workspaces/${workspace}/channels` : null, // 조건부 요청. 로그인한 상태일 때만 가져온다.
        fetcher);
    // 워크스페이스 내 멤버 데이터
    const { mutate: memberData } = useSWR<IUser[]>(
        userData ? `/api/workspaces/${workspace}/members` : null,
        fetcher,
    );
    const [socket, disconnect] = useSocket(workspace);

    // 연결 할 때 사용
    useEffect(() => {
        if (channelData && userData && socket) {
            console.log(socket);
            socket.emit('login', {id: userData.id, channels: channelData.map((v) => v.id)});
        }
    }, [socket, channelData, userData]);

    // 연결 끊어졌을 때) 워크스페이스가 바뀌었을 때 기존 워크스페이스 정리
    useEffect(() => {
        return() => {
            disconnect();
        }
    }, [workspace, disconnect]);

    const onLogout = useCallback( () => {
        axios.post('/api/users/logout', null,{
            withCredentials: true,
        })
            .then(() => {
                mutate(false);
            })
    }, [mutate]);

    const onClickUserProfile = useCallback(() => {
        setShowUserMenu((prev) => !prev)
    }, [])

    const onCloseUserProfile = useCallback((e) => {
        e.stopPropagation();
        setShowUserMenu(false);
    }, [])

    const onClickCreateWorkspace = useCallback(() => {
        setShowCreateWorkspaceModal(true);
    }, [])

    const onCreateWorkspace = useCallback((e) => {
        e.preventDefault();
        if (!newWorkspace || !newWorkspace.trim())  return; // 띄어쓰기 하나만 넣는 경우 방지
        if (!newUrl || !newUrl.trim())  return;

        axios.post('/api/workspaces', {
            workspace: newWorkspace,
            url: newUrl,
        }, {
            withCredentials: true,
        })
            .then(() => {
                mutate();
                setShowCreateWorkspaceModal(false);
                setNewWorkspace('');
                setNewUrl('');
            })
            .catch((error) => {
                console.dir(error);
                toast.error(error.response?.data, { position: 'bottom-center' });
            })
        ;
    }, [newWorkspace, newUrl])

    // 화면에 떠 있는 모든 모달을 닫는 메소드
    const onCloseModal = useCallback(() => {
        setShowCreateWorkspaceModal(false);
        setShowCreateChannelModal(false);
        setShowInviteWorkspaceModal(false);
        setShowInviteChannelModal(false);
    }, [])

    const toggleWorkspaceModal = useCallback(() => {
        setShowWorkspaceModal((prev) => !prev);
    }, [])

    const onClickAddChannel = useCallback( () =>{
        setShowCreateChannelModal(true);
    }, [])

    const onClickInviteWorkspace = useCallback( () =>{
        setShowInviteWorkspaceModal(true);
    }, [])

    const onClickInviteChannel = useCallback( () =>{
        setShowInviteWorkspaceModal(true);
    }, [])

    // 절대로 이 아래에 함수를 추가하지 말 것!
    if(!userData){
        return <Redirect to='/login'/>
    }

    return (
        <div>
            <Header>
                <RightMenu>
                    <span onClick={onClickUserProfile}>
                        <ProfileImg src={gravatar.url(userData.email, {s: '28px', d:'retro'})} alt={userData.email} />
                        {showUserMenu && (
                            <Menu style={{right:0, top:38}} show={showUserMenu} onCloseModal={onCloseUserProfile}>
                                <ProfileModal>
                                    <img src={gravatar.url(userData.email, {s: '36px', d:'retro'})} alt=""/>
                                    <div>
                                        <span id="profile-name">{userData.nickname}</span>
                                        <span id="profile-active">Active</span>
                                    </div>
                                </ProfileModal>
                                <LogOutButton onClick={onLogout}>로그아웃</LogOutButton>
                            </Menu>
                        )}
                    </span>
                </RightMenu>
            </Header>
            <WorkspaceWrapper>
                <Workspaces>{
                    userData.Workspaces.map((ws) => {
                        return (
                            <Link key={ws.id} to = {`/workspace/${ws.name}/channel/일반`}>
                                <WorkspaceButton>{ws.name.slice(0, 1).toUpperCase()}</WorkspaceButton>
                            </Link>
                        )
                    })}
                    <AddButton onClick={onClickCreateWorkspace}>+</AddButton>
                </Workspaces>
                <Channels>
                    <WorkspaceName onClick={toggleWorkspaceModal}>Sleact</WorkspaceName>
                    <MenuScroll>
                        <Menu show={showWorkspaceModal} onCloseModal={toggleWorkspaceModal} style={{top:95, left:80}}>
                            <WorkspaceModal>
                                <h2>Sleact</h2>
                                <button onClick={onClickInviteWorkspace}>워크스페이스에 사용자 초대</button>
                                <button onClick={onClickAddChannel}>채널 만들기</button>
                                <button onClick={onLogout}>로그아웃</button>
                            </WorkspaceModal>
                        </Menu>
                        <ChannelList/>
                        <DMList/>
                    </MenuScroll>
                </Channels>
                <Chats>
                    <Switch>
                        <Route path="/workspace/:workspace/channel/:channel" component={Channel}/>
                        <Route path="/workspace/:workspace/dm/:id" component={DirectMessage}/>
                    </Switch>
                </Chats>
            </WorkspaceWrapper>
            <Modal show = {showCreateWorkspaceModal} onCloseModal={onCloseModal}>
                <form onSubmit={onCreateWorkspace}>
                    <Label id={"workspace-label"}>
                        <span>워크스페이스 이름</span>
                        <Input id="workspace" value={newWorkspace} onChange={onChangeNewWorkspace}/>
                    </Label>
                    <Label id={"workspace-url-label"}>
                        <span>워크스페이스 url</span>
                        <Input id="workspace" value={newUrl} onChange={onChangeNewUrl}/>
                    </Label>
                    <Button type="submit">생성하기</Button>
                </form>
            </Modal>
            <CreateChannelModal show={showCreateChannelModal} onCloseModal={onCloseModal} setShowCreateChannelModal={setShowCreateChannelModal}/>
            <InviteWorkspaceModal show={showInviteWorkspaceModal} onCloseModal={onCloseModal} setShowInviteWorkspaceModal={setShowInviteWorkspaceModal} />
            <InviteChannelModal show={showInviteChannelModal} onCloseModal={onCloseModal} setShowInviteChannelModal={setShowInviteChannelModal} />
        </div>
    );
}

export default Workspace