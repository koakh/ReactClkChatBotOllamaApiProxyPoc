import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import useAutoScrollDiv from './hooks/useAutoScrollDiv';
import { formatDate } from './util';

function App() {
  const [history, setHistory] = useState<{ type: 'system' | 'assistant' | 'user'; prompt: string; timestamp: number }[]>([]);
  const [context, setContext] = useState([]);
  const [system, setSystem] = useState('You are a helpful assistant. please response with one or two sentence only');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [template, setTemplate] = useState('');
  const [title, setTitle] = useState('New chat title');
  const [prompt, setPrompt] = useState('can you explain me the RGB colors scheme?');
  const [isNewChat, setIsNewChat] = useState(true);
  const [chatId, setChatId] = useState<string | null>();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ [key: number]: 'up' | 'down' }>({});
  const [editableIndex, setEditableIndex] = useState<number | null>(null);
  const [editableText, setEditableText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [tags, setTags] = useState<{ name: string }[]>([]);
  // const historyContainer = useRef(null);
  const { elementRef, scrollToBottom } = useAutoScrollDiv();

  const baseApiUrl = 'https://c3edu.online/backend/v1/micropal/chat';
  const apiEndpointTags = `${baseApiUrl}/ollama-tags`;
  const apiEndpointNewChat = `${baseApiUrl}/new`;
  const apiEndpointNextMessage = `${baseApiUrl}/next-message`;
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRldiIsInN1YiI6IkNOPWRldixPVT1DM0RldmVsb3BlcixPVT1QZW9wbGUsREM9YzNlZHUsREM9b25saW5lIiwicm9sZXMiOlsiQzNfREVWRUxPUEVSIiwiQzNfQURNSU5JU1RSQVRPUiJdLCJwZXJtaXNzaW9ucyI6WyJSUF9BQ1RJVkVfRElSRUNUT1JZIiwiUlBfQU5BTFlUSUNTIiwiUlBfQVBQUyIsIlJQX0FVRElUIiwiUlBfQkFORFdJRFRIX0xJTUlUUyIsIlJQX0JBVFRFUlkiLCJSUF9CTEFDS19MSVNUSU5HIiwiUlBfQ0FDSElORyIsIlJQX0NMQVNTRVMiLCJSUF9DT05URU5UIiwiUlBfREFTSEJPQVJEIiwiUlBfRklSRVdBTEwiLCJSUF9HUE8iLCJSUF9JTlRFUk5FVF9BQ0NFU1MiLCJSUF9LSU9TSyIsIlJQX0xBTkRJTkdfUEFHRSIsIlJQX0xFQVJOSU5HX1BBVEhTIiwiUlBfTElDRU5TRSIsIlJQX0xPQ0FMX0FSRUFfTkVUV09SSyIsIlJQX01BSU5URU5BTkNFIiwiUlBfTUlDUk9QQUxfQ0hBVCIsIlJQX01JQ1JPUEFMX0hJU1RPUlkiLCJSUF9NSUNST1BBTF9UT09MUyIsIlJQX01PREVNIiwiUlBfTU9OSVRPUklORyIsIlJQX1BST1hZX1NFVFRJTkdTIiwiUlBfUkVNT1RFX1NFUlZJQ0VTIiwiUlBfU0hBUkVTIiwiUlBfVElNRV9DT05GSUdVUkFUSU9OIiwiUlBfVVBEQVRFUiIsIlJQX1VTRVJTIiwiUlBfV0hJVEVMSVNUSU5HIiwiUlBfV0lSRUxFU1MiLCJSUF9XSVJFTEVTU19BQ0NFU1MiXSwibWV0YURhdGEiOnsicHJvZmlsZSI6IkMzRGV2ZWxvcGVyIn0sImlhdCI6MTcyODU1OTk2NywiZXhwIjozMzI4NjE1OTk2N30.SdBreT8P8bSNyYw2e-vqepL3oBkoqSx9Tz-mMqZgjsg';
  const headers = useMemo(() => {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
  }, []);

  const disableButton = () => {
    return loading || prompt === '' || selectedTag === '';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCancel = () => {
    if (editableIndex !== null) {
      setEditableText(history[editableIndex]?.prompt || '');
      setEditableIndex(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFeedback = (index: number, type: 'up' | 'down') => {
    setFeedback({
      ...feedback,
      [index]: type,
    });

    if (type === 'down') {
      setEditableIndex(index);
      setEditableText(history[index]?.prompt || '');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = () => {
    if (editableIndex !== null) {
      const updatedHistory = [...history];
      updatedHistory[editableIndex].prompt = editableText;
      setHistory(updatedHistory);
      setEditableIndex(null);
    }
  };


  const sendPrompt = useCallback(async () => {
    setLoading(true);

    let tempHistory = [...history, { prompt: '', type: 'assistant' as 'assistant', timestamp: Date.now() }];

    setHistory(tempHistory);
    const tempIndex = tempHistory.length - 1;

    const requestOptions = isNewChat
      // newChat
      ? {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: selectedTag,
          system,
          context,
          template,
          title,
          prompt,
          options: { temperature: 0.8 }
        })
      }
      // nextMessage
      : {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chatId,
          prompt,
        })
      };

    const endpoint = isNewChat ? apiEndpointNewChat : apiEndpointNextMessage;
    const response = await fetch(endpoint, requestOptions);
    const reader = response.body?.getReader();

    if (reader) {
      let assistantResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          setLoading(false);
          break;
        }

        const decodedValue = new TextDecoder('utf-8').decode(value);
        // console.log(`value: ${value}\r\ndecodedValue:${decodedValue}`);

        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { response, message, done, context, infoContext, chatId } = JSON.parse(decodedValue);

          // /generate uses response, /chat uses content
          const contentProperty = isNewChat ? response : message.content;

          if ([contentProperty]) {
            assistantResponse += [contentProperty];
            tempHistory[tempIndex].prompt = assistantResponse;
            setHistory([...tempHistory]);
            scrollToBottom();
          }

          if (done) {
            setContext(context);
            setIsNewChat(false);
            if (isNewChat && chatId) {
              setChatId(chatId);
            }
            setPrompt('');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [apiEndpointNewChat, apiEndpointNextMessage, chatId, context, headers, history, isNewChat, prompt, scrollToBottom, selectedTag, system, template, title]);

  useEffect(() => {
    fetch(apiEndpointTags, { headers })
      .then((response) => response.json())
      .then((data: { models: any[] }) => {
        setTags(data.models);
        if (data?.models[0]?.name) {
          setSelectedTag(data.models[0].name);
        }
      });
  }, [apiEndpointTags, headers]);

  useEffect(() => {
    // if latest message is from the user, call sendPrompt
    if (history.length > 0 && history[history.length - 1].type === 'user') {
      sendPrompt();
    }
  }, [history, sendPrompt]);

  return (
    <div className="App">
      <div className="history-container disabled" ref={elementRef}>
        <div className="history">
          {history.map((item, index) => (
            <div key={index} className={`message ${item.type}`}>
              <p className='roboto-regular-italic'>{`${item.type.toUpperCase()} ${formatDate(new Date(item.timestamp))}`}</p>
              {editableIndex === index ? null : item.prompt}
              {editableIndex === index ? (
                <textarea
                  className="textarea-editable roboto-regular"
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  readOnly
                />
              ) : null}
              {/* feedback */}
              {/* {item.type === 'assistant' && (
                <div className="feedback-icons">
                  {editableIndex === index && (
                    <>
                      <button className="saveBtn" onClick={handleSave}>Save</button>
                      <button className="cancelBtn" onClick={handleCancel}>Cancel</button>
                    </>
                  )}
                  <span><button className={`${feedback[index] === 'up' ? 'selected' : ''}`} onClick={() => handleFeedback(index, 'up')}>👍</button>
                    <button className={`${feedback[index] === 'down' ? 'selected' : ''}`} onClick={() => handleFeedback(index, 'down')}>👎</button>
                  </span>
                </div>
              )} */}
            </div>
          ))}
        </div>
      </div>

      <div className="input-area">
        {isNewChat && <textarea
          className="textarea roboto-regular"
          placeholder="System prompt (optional)"
          value={system}
          onChange={(e) => setSystem(e.target.value)}
          readOnly={loading}
        ></textarea>
        }

        <textarea
          className="textarea"
          placeholder="Enter your prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>

        <div className='toolbox'>
          {isNewChat && <>
            {/* title */}
            <input
              className="input-text"
              type='text'
              placeholder="New chat title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            ></input>
            {/* model */}
            <select
              className="input-select"
              onChange={(v) => setSelectedTag(v.target.value)}>
              {tags?.map((tag) => (
                <option key={tag.name} value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </select>
          </>
          }
          {!isNewChat &&
            <input
              className="input-text disabled"
              type='text'
              value={chatId || ''}
              readOnly={true}
            ></input>
          }
          {/* new / nextMessage */}
          <button
            className={`send-button ${disableButton() ? 'disabled' : ''}`}
            style={{ marginLeft: "auto" }}
            disabled={disableButton()}
            onClick={async () => {
              setHistory(prevHistory => [...prevHistory, { prompt, type: 'user', timestamp: Date.now() }]);
            }}
          >
            {isNewChat ? 'New chat' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;