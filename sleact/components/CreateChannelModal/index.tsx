import React, {useCallback, VFC} from 'react';
import {Button, Input, Label} from "@pages/SignUp/styles";
import Modal from "@components/Modal";
import useInput from "@hooks/useInput";
import axios from "axios";
import {useParams} from "react-router";
import {toast} from "react-toastify";
import {IChannel, IUser} from "@typings/db";
import fetcher from "@utils/fetcher";
import useSWR from "swr";

interface Props {
    show: boolean;
    onCloseModal: () => void;
    setShowCreateChannelModal: (flag: boolean) => void;
}
const CreateChannelModal: VFC<Props> = ({show, onCloseModal, setShowCreateChannelModal}) => {
    const [newChannel, onChangeNewChannel, setNewChannel] = useInput('');
    const { workspace, channel } = useParams<{ workspace: string, channel: string }>();
    const { data: userData, error, mutate } = useSWR<IUser | false>('http://localhost:3095/api/users', fetcher, {dedupingInterval: 2000,});
    // 채널 데이터를 서버로부터 받아오기
    const { data: channelData, mutate: mutateChannel} = useSWR<IChannel[]>(
        userData ? `http://localhost:3095/api/workspaces/${workspace}/channels` : null, // 조건부 요청. 로그인한 상태일 때만 가져온다.
        fetcher);

    const onCreateChannel = useCallback((e) => {
        e.preventDefault();
        console.log('채널 이름'+workspace)
        axios.post(`http://localhost:3095/api/workspaces/${workspace}/channels`, {
            name: newChannel
        }, {
            withCredentials: true,
        }).then(() => {
            setShowCreateChannelModal(false);
            mutateChannel();
            setNewChannel('');
        }).catch((error) => {
            console.dir(error);
            toast.error(error.response?.data, {position: 'bottom-center'})
        })
    }, [newChannel]);

    return (
        <Modal show = {show} onCloseModal={onCloseModal}>
            <form onSubmit={onCreateChannel}>
                <Label id={"channel-label"}>
                    <span>채널</span>
                    <Input id="channel" value={newChannel} onChange={onChangeNewChannel}/>
                </Label>
                <Button type="submit">생성하기</Button>
            </form>
        </Modal>
    )
};

export default CreateChannelModal;