import React, {memo, useMemo, VFC} from 'react';
import {IDM} from "@typings/db";
import {ChatWrapper} from "@components/Chat/styles";
import gravatar from "gravatar";
import dayjs from 'dayjs';
import regexifyString from "regexify-string";
import {Link, useParams} from "react-router-dom";

interface Props {
    data: IDM;
}
const Chat: VFC<Props> = ({data}) => {
    const { workspace } = useParams<{ workspace: string; channel: string }>();
    const user = data.Sender;
    const result = useMemo(() =>regexifyString({
        input: data.content,
        pattern: /@\[(.+?)]\((\d+?)\)|\n/g, // 아이디와 줄바꿈 둘다 찾음
        decorator(match, index) {
            const arr: string[] | null = match.match(/@\[(.+?)]\((\d+?)\)/)!;   // 아이디만 찾음
            console.log(arr)
            if (arr) {
                return(
                    <Link key={match + index} to={`/workspace/${workspace}/dm/${arr[2]}`}>
                        @{arr[1]}
                    </Link>
                )
            }
            // 줄바꿈
            return <br key={index} />;
        }
    }), [data.content]);
    return (
        <ChatWrapper>
        <div className="chat-img">
            <img src={gravatar.url(user.email, {s: '36px', d: 'retro'})} alt={user.nickname} />
        </div>
        <div className="chat-text">
            <div className="chat-user">
                <b>{user.nickname}</b>
                <span>{dayjs(data.createdAt).format('h:mm A')}</span>
            </div>
            <p>{result}</p>
        </div>
        </ChatWrapper>
    );
};

export default memo(Chat);