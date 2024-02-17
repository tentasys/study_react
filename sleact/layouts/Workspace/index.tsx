import React, {FC, useCallback, useState} from "react";
import useSWR from "swr";
import fetcher from "@utils/fetcher";
import axios from "axios";
import {Redirect} from "react-router";
import {
    Channels,
    Chats,
    Header, LogOutButton, MenuScroll,
    ProfileImg, ProfileModal,
    RightMenu,
    WorkspaceName,
    Workspaces,
    WorkspaceWrapper
} from "@layouts/Workspace/styles";
import gravatar from 'gravatar'
import {Route, Switch} from "react-router-dom";
import loadable from "@loadable/component";
import Menu from "@components/Menu";

const Channel = loadable(() => import('@pages/Channel'))
const DirectMessage = loadable(() => import('@pages/DirectMessage'))

const Workspace: FC = ({children}) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { data, error, mutate } = useSWR('http://localhost:3095/api/users', fetcher);
    const onLogout = useCallback( () => {
        axios.post('http://localhost:3095/api/users/logout', null,{
            withCredentials: true,
        })
            .then(() => {
                mutate(false);
            })
    }, []);

    const onClickUserProfile = useCallback(() => {
        setShowUserMenu((prev) => !prev)
    }, [])

    if(!data){
        return <Redirect to='/login'/>
    }

    return (
        <div>
            <Header>
                <RightMenu>
                    <span onClick={onClickUserProfile}>
                        <ProfileImg src={gravatar.url(data.email, {s: '28px', d:'retro'})} alt={data.email} />
                        {showUserMenu && (
                            <Menu style={{right:0, top:38}} show={showUserMenu} onCloseModal={onClickUserProfile}>
                                <ProfileModal>
                                    <img src={gravatar.url(data.email, {s: '36px', d:'retro'})} alt=""/>
                                    <div>
                                        <span id="profile-name">{data.nickname}</span>
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
                <Workspaces>test</Workspaces>
                <Channels>
                    <WorkspaceName>Sleact</WorkspaceName>
                    <MenuScroll>MenuScroll</MenuScroll>
                </Channels>
                <Chats>
                    <Switch>
                        <Route path="/workspace/channel" component={Channel}/>
                        <Route path="/workspace/dm" component={DirectMessage}/>
                    </Switch>
                </Chats>
            </WorkspaceWrapper>
        </div>
    );
}

export default Workspace