import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

function App() {
  const [history, setHistory] = useState<{ type: 'assistant' | 'user'; prompt: string; timestamp: number }[]>([]);
  const [context, setContext] = useState([]);
  const [system, setSystem] = useState('You are a helpful assistant. please response with one or two sentence only');
  const [title, setTitle] = useState('New chat title');
  const [prompt, setPrompt] = useState('can you explain me the RGB colors scheme?');
  const [newChat, setNewChat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ [key: number]: 'up' | 'down' }>({});
  const [editableIndex, setEditableIndex] = useState<number | null>(null);
  const [editableText, setEditableText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  // TODO: full object props
  const [tags, setTags] = useState<{ name: string }[]>([]);

  const baseApiUrl = 'https://c3edu.online/backend/v1/micropal/chat';
  const apiEndpointTags = `${baseApiUrl}/ollama-tags`;
  const apiEndpointNewChat = `${baseApiUrl}/new`;
  // TODO:
  // const apiEndpointnextMessage = `${baseApiUrl}/next-message`;
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRldiIsInN1YiI6IkNOPWRldixPVT1DM0RldmVsb3BlcixPVT1QZW9wbGUsREM9YzNlZHUsREM9b25saW5lIiwicm9sZXMiOlsiQzNfREVWRUxPUEVSIiwiQzNfQURNSU5JU1RSQVRPUiJdLCJwZXJtaXNzaW9ucyI6WyJSUF9BQ1RJVkVfRElSRUNUT1JZIiwiUlBfQU5BTFlUSUNTIiwiUlBfQVBQUyIsIlJQX0FVRElUIiwiUlBfQkFORFdJRFRIX0xJTUlUUyIsIlJQX0JBVFRFUlkiLCJSUF9CTEFDS19MSVNUSU5HIiwiUlBfQ0FDSElORyIsIlJQX0NMQVNTRVMiLCJSUF9DT05URU5UIiwiUlBfREFTSEJPQVJEIiwiUlBfRklSRVdBTEwiLCJSUF9HUE8iLCJSUF9JTlRFUk5FVF9BQ0NFU1MiLCJSUF9LSU9TSyIsIlJQX0xBTkRJTkdfUEFHRSIsIlJQX0xFQVJOSU5HX1BBVEhTIiwiUlBfTElDRU5TRSIsIlJQX0xPQ0FMX0FSRUFfTkVUV09SSyIsIlJQX01BSU5URU5BTkNFIiwiUlBfTUlDUk9QQUxfQ0hBVCIsIlJQX01JQ1JPUEFMX0hJU1RPUlkiLCJSUF9NSUNST1BBTF9UT09MUyIsIlJQX01PREVNIiwiUlBfTU9OSVRPUklORyIsIlJQX1BST1hZX1NFVFRJTkdTIiwiUlBfUkVNT1RFX1NFUlZJQ0VTIiwiUlBfU0hBUkVTIiwiUlBfVElNRV9DT05GSUdVUkFUSU9OIiwiUlBfVVBEQVRFUiIsIlJQX1VTRVJTIiwiUlBfV0hJVEVMSVNUSU5HIiwiUlBfV0lSRUxFU1MiLCJSUF9XSVJFTEVTU19BQ0NFU1MiXSwibWV0YURhdGEiOnsicHJvZmlsZSI6IkMzRGV2ZWxvcGVyIn0sImlhdCI6MTcyODQ5MzM1NiwiZXhwIjozMzI4NjA5MzM1Nn0.aYB4MK94latLr3rWRw-BmF7wMjxGACacCfT1EMNDugY';
  const headers = useMemo(() => {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
  }, []);

  const handleCancel = () => {
    if (editableIndex !== null) {
      setEditableText(history[editableIndex]?.prompt || '');
      setEditableIndex(null);
    }
  };

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

    const requestOptions = {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: selectedTag,
        title,
        prompt,
        system,
        template: '',
        context,
        options: { temperature: 0.8 }
      })
    };
    const response = await fetch(apiEndpointNewChat, requestOptions);
    const reader = response.body?.getReader();

    if (reader) {
      let assistantResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          setLoading(false);
          setNewChat(false);
          setPrompt('');
          break;
        }

        const decodedValue = new TextDecoder('utf-8').decode(value);
        console.log(`value: ${value}\r\ndecodedValue:${decodedValue}`);

        try {
          const { response, done, context } = JSON.parse(decodedValue);

          if (response) {
            assistantResponse += response;
            tempHistory[tempIndex].prompt = assistantResponse;
            setHistory([...tempHistory]);
          }

          if (done) {
            setContext(context);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [apiEndpointNewChat, context, headers, history, prompt, selectedTag, system, title]);

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
      <div className="history-container">
        <div className="history">
          {history.map((item, index) => (
            <div key={index} className={`message ${item.type}`}>
              <strong>{`${item.type.toUpperCase()} ${new Date(item.timestamp).toLocaleString()}`}</strong>:
              {editableIndex === index ? null : item.prompt}
              {editableIndex === index ? (
                <textarea
                  className="textarea-editable"
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                />
              ) : null}
              {item.type === 'assistant' && (
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
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="input-area">
        {newChat && <textarea
          className="textarea"
          placeholder="System prompt (optional)"
          value={system}
          onChange={(e) => setSystem(e.target.value)}
        ></textarea>
        }

        <textarea
          className="textarea"
          placeholder="Enter your prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>

        <div className='toolbox'>
          {newChat &&
            <><input
              type='text'
              placeholder="New chat title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            ></input><select onChange={(v) => setSelectedTag(v.target.value)}>
                {tags?.map((tag) => (
                  <option key={tag.name} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select><button
                className={`send-button ${loading ? 'disabled' : ''}`}
                style={{ marginLeft: "auto" }}
                disabled={loading && selectedTag !== ''}
                onClick={async () => {
                  setHistory(prevHistory => [...prevHistory, { prompt, type: 'user', timestamp: Date.now() }]);
                }}
              >
                Send
              </button></>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
