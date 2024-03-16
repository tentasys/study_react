import React, {forwardRef, useCallback} from 'react';
import {ChatZone, Section, StickyHeader} from "@components/ChatList/styles";
import {IDM} from "@typings/db";
import Chat from "@components/Chat";
import { Scrollbars } from 'react-custom-scrollbars';

interface Props {
    chatSections: {[key: string]: IDM[]};
    setSize: (f: (size: number) => number) => Promise<IDM[][] | undefined>
    isEmpty: boolean;
    isReachingEnd: boolean;
}

const ChatList = forwardRef<Scrollbars, Props>((({ chatSections , setSize, isEmpty, isReachingEnd}, ref) => {

    const onScroll = useCallback((values) => {
        if (values.scrollTop === 0 && !isReachingEnd) {
            console.log('가장 위');
            // 데이터 추가 로딩. 스크롤이 맨 위로 올라가면 사이즈를 하나 추가한다.
            setSize((prevSize) => prevSize + 1)
                .then(() => {
                    // 스크롤 위치 유지
                });
        }
    }, [])
   return (
      <ChatZone>
          <Scrollbars autoHide ref={ref} onScrollFrame={onScroll}>
              { Object.entries(chatSections).map(([date, chats]) => {
                  return (
                      <Section className={`section-${date}`} key={date}>
                          <StickyHeader>
                              <button>{date}</button>
                          </StickyHeader>
                          {chats.map((chat)=> (
                              <Chat key={chat.id} data={chat} />
                          ))}
                      </Section>
                  )
              })}
          </Scrollbars>
      </ChatZone>
  )
}));

export default ChatList;