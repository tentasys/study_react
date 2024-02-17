import React, {useCallback, useState} from "react";
import {Header, Form, Label, Input, LinkContainer, Button, Error} from "@pages/SignUp/styles";
import {Link} from "react-router-dom";
import axios from "axios";
import useInput from "@hooks/useInput";
import useSWR from "swr";
import fetcher from "@utils/fetcher";
import {Redirect} from "react-router";

const LogIn = () => {
    const { data, error, mutate } = useSWR('http://localhost:3095/api/users', fetcher);
    const [logInError, setLogInError] = useState(false);
    const [email, onChangeEmail] = useInput('');
    const [password, onChangePassword] = useInput('');
    const onSubmit = useCallback( (e) => {
        e.preventDefault();

        axios
            .post(
                '/api/users/login',
                { email, password },
                {
                    withCredentials: true,
                },
            )
            .then((response) => {
                mutate(response.data);
            })
            .catch((error) => {

            });
    }, [email, password]);

    //화면 깜빡임이 거슬릴 경우
    if(data === undefined){
        return <div>로딩중...</div>;
    }

    if(data) {
        return <Redirect to="/workspace/sleact/channel/일반"/>;
    }
    // console.log(error, userData);
    // if (!error && userData) {
    //   console.log('로그인됨', userData);
    //   return <Redirect to="/workspace/sleact/channel/일반" />;
    // }

    return (
        <div id="container">
            <Header>Sleact</Header>
            <Form onSubmit={onSubmit}>
                <Label id="email-label">
                    <span>이메일 주소</span>
                    <div>
                        <Input type="email" id="email" name="email" value={email} onChange={onChangeEmail} />
                    </div>
                </Label>
                <Label id="password-label">
                    <span>비밀번호</span>
                    <div>
                        <Input type="password" id="password" name="password" value={password} onChange={onChangePassword} />
                    </div>
                    {logInError && <Error>이메일과 비밀번호 조합이 일치하지 않습니다.</Error>}
                </Label>
                <Button type="submit">로그인</Button>
            </Form>
            <LinkContainer>
                아직 회원이 아니신가요?&nbsp;
                <Link to="/signup">회원가입 하러가기</Link>
            </LinkContainer>
        </div>
    );
}

export default LogIn