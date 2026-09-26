import { useEffect, useState, useRef } from "react";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { convertToRaw,ContentState,EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { useTheme } from '@/context/ThemeContext.jsx';
import './NewsPreview.css';

export default function NewsEditor(props) {
  const { isDarkMode } = useTheme();
  const [editorState,setEditorState] = useState(() => {
    // 初始化时如果没有内容，创建空状态
    return EditorState.createEmpty();
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(()=>{
    if (!isMountedRef.current) return;
    
    // console.log(props.content);
    const html = props.content
    if(html === undefined || html === '') {
      // 如果没有内容，设置为空状态
      if (isMountedRef.current) {
        setEditorState(EditorState.createEmpty());
      }
      return;
    }
    
    try {
      const contentBlock = htmlToDraft(html);
      if (contentBlock && contentBlock.contentBlocks) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        const newEditorState = EditorState.createWithContent(contentState);
        if (isMountedRef.current) {
          setEditorState(newEditorState);
        }
      }
    } catch (error) {
      console.error('Error parsing HTML content:', error);
      if (isMountedRef.current) {
        setEditorState(EditorState.createEmpty());
      }
    }
  },[props.content])

  const handleEditorStateChange = (newEditorState) => {
    if (isMountedRef.current) {
      setEditorState(newEditorState);
    }
  };

  const handleBlur = () => {
    if (!isMountedRef.current || !editorState) return;
    try {
      // console.log(draftToHtml(convertToRaw(editorState.getCurrentContent())));
      const content = draftToHtml(convertToRaw(editorState.getCurrentContent()));
      if (isMountedRef.current && props.getContent) {
        props.getContent(content);
      }
    } catch (error) {
      console.error('Error converting editor content:', error);
    }
  };

  return (
    <div className={`news-preview-content ${isDarkMode ? 'dark' : ''}`}>
      <Editor
        className={`news-preview-content ${isDarkMode ? 'dark' : ''}`}
        editorState={editorState}
        toolbarClassName="toolbarClassName"
        wrapperClassName="wrapperClassName"
        editorClassName="editorClassName"
        onEditorStateChange={handleEditorStateChange}
        onBlur={handleBlur}
        readOnly={false}
      />
    </div>
  )
}
