import React, {ForwardedRef, forwardRef, MutableRefObject, RefObject, useCallback} from 'react';
import {ChatZone, Section, StickyHeader} from "@components/ChatList/styles";
import {IDM} from "@typings/db";
import Chat from "@components/Chat";
import { Scrollbars } from 'react-custom-scrollbars';
import {VFC} from "react";

interface Props {
    chatSections: {[key: string]: IDM[]};
    setSize: (f: (size: number) => number) => Promise<IDM[][] | undefined>;
    isReachingEnd: boolean;
    scrollRef: RefObject<Scrollbars>;
}

const ChatList = forwardRef<Scrollbars, Props>(({ chatSections, setSize, isReachingEnd }, scrollRef) => {
    const onScroll = useCallback(
        (values) => {
            if (values.scrollTop === 0 && !isReachingEnd) {
                console.log('가장 위');
                setSize((prevSize) => prevSize + 1).then(() => {
                    // 스크롤 위치 유지
                    const current = (scrollRef as MutableRefObject<Scrollbars>)?.current;
                    if (current) {
                        current.scrollTop(current.getScrollHeight() - values.scrollHeight);
                    }
                });
            }
        },
        [scrollRef, isReachingEnd, setSize],
    );
   return (
      <ChatZone>
          <Scrollbars autoHide ref={scrollRef} onScrollFrame={onScroll}>
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
});

export default ChatList;