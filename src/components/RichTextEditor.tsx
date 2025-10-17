"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Extension } from '@tiptap/core';
import { Node } from '@tiptap/core';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}



export default function RichTextEditor({ content, onChange, placeholder = "내용을 입력하세요..." }: RichTextEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedFontFamily, setSelectedFontFamily] = useState('Inter');
  const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState('16px');
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [customFontInput, setCustomFontInput] = useState('');
  const [isCustomFontOpen, setIsCustomFontOpen] = useState(false);

  // 모달이 열릴 때 배경 스크롤 방지 (색상 선택기는 제외)
  useScrollLock(isLinkModalOpen || isImageModalOpen);

  useEffect(() => {
    setIsMounted(true);
    
    // localStorage에서 사용자 정의 폰트 로드
    const savedFonts = localStorage.getItem('richTextEditor-customFonts');
    if (savedFonts) {
      try {
        const fonts = JSON.parse(savedFonts);
        setCustomFonts(fonts);
        console.log('🔍 저장된 사용자 정의 폰트 로드:', fonts);
      } catch (error) {
        console.warn('사용자 정의 폰트 로드 실패:', error);
      }
    }
  }, []);

  // 색상 선택기 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (isColorPickerOpen && !target.closest('.color-picker-container')) {
        setIsColorPickerOpen(false);
      }
      
      if (isFontFamilyOpen && !target.closest('.font-family-container')) {
        setIsFontFamilyOpen(false);
      }
      
      if (isFontSizeOpen && !target.closest('.font-size-container')) {
        setIsFontSizeOpen(false);
      }
      
      if (isCustomFontOpen && !target.closest('.custom-font-container')) {
        setIsCustomFontOpen(false);
      }
    };

    if (isColorPickerOpen || isFontFamilyOpen || isFontSizeOpen || isCustomFontOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColorPickerOpen, isFontFamilyOpen, isFontSizeOpen, isCustomFontOpen]);


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit에서 중복되는 확장 제외
        link: false,
        underline: false,
      }),
      TextStyle.configure({
        types: ['paragraph', 'heading'],
      }),
      Color,
      // 커스텀 폰트 패밀리 확장
      Extension.create({
        name: 'fontFamily',
        addGlobalAttributes() {
          return [
            {
              types: ['textStyle'],
              attributes: {
                fontFamily: {
                  default: null,
                  parseHTML: element => element.style.fontFamily?.replace(/['"]/g, ''),
                  renderHTML: attributes => {
                    if (!attributes.fontFamily) {
                      return {};
                    }
                    return {
                      style: `font-family: ${attributes.fontFamily}`,
                    };
                  },
                },
              },
            },
          ];
        },
        addCommands() {
          return {
            setFontFamily: (fontFamily: string) => ({ chain }) => {
              return chain().setMark('textStyle', { fontFamily }).run();
            },
            unsetFontFamily: () => ({ chain }) => {
              return chain()
                .setMark('textStyle', { fontFamily: null })
                .removeEmptyTextStyle()
                .run();
            },
          };
        },
      }),
      // 커스텀 폰트 크기 확장
      Extension.create({
        name: 'fontSize',
        addGlobalAttributes() {
          return [
            {
              types: ['textStyle'],
              attributes: {
                fontSize: {
                  default: null,
                  parseHTML: element => element.style.fontSize,
                  renderHTML: attributes => {
                    if (!attributes.fontSize) {
                      return {};
                    }
                    return {
                      style: `font-size: ${attributes.fontSize}`,
                    };
                  },
                },
              },
            },
          ];
        },
        addCommands() {
          return {
            setFontSize: (fontSize: string) => ({ chain }) => {
              return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }) => {
              return chain()
                .setMark('textStyle', { fontSize: null })
                .removeEmptyTextStyle()
                .run();
            },
          };
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm',
        },
        inline: false,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // HTML을 가져올 때 인라인 스타일이 포함되도록 함
      let html = editor.getHTML();
      console.log('🔍 에디터 HTML 업데이트:', html);
      
      // HTML 정규화: 일관된 줄간격을 위한 처리
      // 1. 빈 p 태그 정리
      html = html.replace(/<p><\/p>/g, '<p><br></p>');
      // 2. 연속된 빈 p 태그 정리
      html = html.replace(/<p><\/p><p><\/p>/g, '<p><br></p><p><br></p>');
      // 3. p 태그에 일관된 스타일 적용
      html = html.replace(/<p>/g, '<p style="margin: 0 0 1em 0; line-height: 1.1;">');
      // 4. 남은 줄바꿈 문자 처리
      html = html.replace(/\n/g, '<br>');
      console.log('🔍 줄바꿈 변환 후:', html);
      
      // content prop과 다를 때만 onChange 호출 (무한 루프 방지)
      if (html !== content) {
        console.log('🔍 onChange 함수 호출 전');
        // 커서 위치 보존을 위해 지연 호출
        requestAnimationFrame(() => {
          onChange(html);
        });
        console.log('🔍 onChange 함수 호출 후');
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // onSelectionUpdate에서는 onChange 호출하지 않음 (커서 위치 문제 방지)
      // 선택 영역 변경 시에는 HTML 변환하지 않음
      
      // 현재 선택된 텍스트의 폰트 정보 업데이트
      const { from, to } = editor.state.selection;
      console.log('🔍 선택 영역:', { from, to, hasSelection: from !== to });
      
      if (from !== to) {
        // 텍스트가 선택된 경우
        const selectedText = editor.state.doc.textBetween(from, to);
        console.log('🔍 선택된 텍스트:', selectedText);
        
        if (selectedText) {
          // 선택된 텍스트의 스타일 정보 가져오기
          const textStyleAttrs = editor.getAttributes('textStyle');
          console.log('🔍 텍스트 스타일 속성:', textStyleAttrs);
          
          const { fontFamily, fontSize } = textStyleAttrs;
          console.log('🔍 추출된 폰트 정보:', { fontFamily, fontSize });
          
          if (fontFamily && fontFamily !== 'inherit') {
            console.log('🔍 폰트 패밀리 업데이트:', fontFamily);
            setSelectedFontFamily(fontFamily);
          } else {
            console.log('🔍 폰트 패밀리 없음, 기본값 유지');
          }
          
          if (fontSize && fontSize !== 'inherit') {
            console.log('🔍 폰트 크기 업데이트:', fontSize);
            setSelectedFontSize(fontSize);
          } else {
            console.log('🔍 폰트 크기 없음, 기본값 유지');
          }
        }
      } else {
        // 커서만 있는 경우 - 현재 위치의 스타일 정보 가져오기
        const textStyleAttrs = editor.getAttributes('textStyle');
        console.log('🔍 커서 위치 스타일:', textStyleAttrs);
        
        const { fontFamily, fontSize } = textStyleAttrs;
        console.log('🔍 커서 위치 폰트 정보:', { fontFamily, fontSize });
        
        if (fontFamily && fontFamily !== 'inherit') {
          setSelectedFontFamily(fontFamily);
        }
        if (fontSize && fontSize !== 'inherit') {
          setSelectedFontSize(fontSize);
        }
      }
    },
    onFocus: ({ editor }) => {
      // 포커스 시 커서 위치 보존
      console.log('🔍 에디터 포커스됨');
    },
    onBlur: ({ editor }) => {
      // 블러 시에도 커서 위치 보존
      console.log('🔍 에디터 블러됨');
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor focus:outline-none min-h-[600px] p-4 bg-white',
        style: 'line-height: 1.1; font-size: 14px; font-family: Inter, sans-serif;',
      },
      handleKeyDown: (view, event) => {
        // 백스페이스 키 처리 개선
        if (event.key === 'Backspace') {
          // 백스페이스 키의 기본 동작을 허용하되, 커서 위치 보존
          const { state, dispatch } = view;
          const { selection } = state;
          
          // 빈 노드에서 백스페이스 시 커서 위치 보존
          if (selection.empty && selection.$from.parent.textContent === '') {
            // 커서 위치를 유지하면서 백스페이스 처리
            return false; // 기본 동작 허용
          }
          
          // 백스페이스 키의 기본 동작을 허용
          return false;
        }
        
        // 모든 키 이벤트를 기본 동작으로 처리
        return false;
      },
      handleClick: (view, event) => {
        // 클릭 시 커서 위치 보존
        return false;
      },
      handleMouseDown: (view, event) => {
        // 마우스 다운 시 커서 위치 보존
        return false;
      },
    },
    onCreate: ({ editor }) => {
      // URL 감지 및 미리보기 생성 함수
      const detectAndCreateUrlPreview = (text: string) => {
        // URL 패턴 감지 (YouTube, Twitter, Instagram, 일반 URL)
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlPattern);
        
        if (urls && urls.length > 0) {
          const url = urls[0];
          
          // YouTube, Twitter, Instagram, 또는 일반 URL인지 확인
          if (url.includes('youtube.com') || url.includes('youtu.be') || 
              url.includes('twitter.com') || url.includes('x.com') || 
              url.includes('instagram.com') || 
              url.includes('facebook.com') || url.includes('linkedin.com') ||
              url.includes('github.com') || url.includes('stackoverflow.com')) {
            
            // 현재 커서 위치에서 URL 텍스트 제거
            const { from, to } = editor.state.selection;
            const textBefore = editor.state.doc.textBetween(0, from);
            const textAfter = editor.state.doc.textBetween(to, editor.state.doc.content.size);
            
            // URL이 포함된 텍스트를 찾아서 제거
            const fullText = textBefore + textAfter;
            const urlIndex = fullText.lastIndexOf(url);
            
            if (urlIndex !== -1) {
              // URL 앞의 텍스트와 뒤의 텍스트를 분리
              const beforeUrl = fullText.substring(0, urlIndex);
              const afterUrl = fullText.substring(urlIndex + url.length);
              
              // 에디터 내용을 URL 앞까지로 설정
              editor.commands.setContent(beforeUrl);
              
              // URL을 링크로 삽입
              editor.commands.insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
              
              // URL 뒤의 텍스트가 있으면 추가
              if (afterUrl.trim()) {
                editor.commands.insertContent(afterUrl);
              }
              
              console.log('🔗 URL 미리보기 생성:', url);
              return true;
            }
          }
        }
        return false;
      };

      // 붙여넣기된 HTML을 정리하는 함수
      const cleanPastedHtml = (html: string): string => {
        // 1. 스크립트 태그 제거
        let cleaned = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
        
        // 2. 줄 간격 관련 스타일 제거 (line-height, margin, padding)
        cleaned = cleaned.replace(/line-height\s*:\s*[^;]+;?/gi, '');
        cleaned = cleaned.replace(/margin\s*:\s*[^;]+;?/gi, '');
        cleaned = cleaned.replace(/padding\s*:\s*[^;]+;?/gi, '');
        cleaned = cleaned.replace(/margin-top\s*:\s*[^;]+;?/gi, '');
        cleaned = cleaned.replace(/margin-bottom\s*:\s*[^;]+;?/gi, '');
        cleaned = cleaned.replace(/padding-top\s*:\s*[^;]+;?/gi, '');
        cleaned = cleaned.replace(/padding-bottom\s*:\s*[^;]+;?/gi, '');
        
        // 3. 불필요한 div 태그 정리
        cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, '');
        cleaned = cleaned.replace(/<div[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, '<br>');
        
        // 4. 연속된 br 태그 정리 (최대 2개까지만)
        cleaned = cleaned.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');
        
        // 5. 빈 p 태그 정리
        cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');
        cleaned = cleaned.replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '<br>');
        
        // 6. 스타일 속성에서 불필요한 속성 제거
        cleaned = cleaned.replace(/style\s*=\s*["'][^"']*["']/gi, (match) => {
          const styleContent = match.replace(/style\s*=\s*["']([^"']*)["']/gi, '$1');
          const cleanStyle = styleContent
            .split(';')
            .filter(style => {
              const prop = style.split(':')[0]?.trim().toLowerCase();
              return !['line-height', 'margin', 'padding', 'margin-top', 'margin-bottom', 'padding-top', 'padding-bottom'].includes(prop);
            })
            .join(';');
          
          return cleanStyle ? `style="${cleanStyle}"` : '';
        });
        
        console.log('🧹 HTML 정리 완료:', { original: html.length, cleaned: cleaned.length });
        return cleaned;
      };

      // TipTap의 내장 붙여넣기 처리 비활성화
      editor.setOptions({
        editorProps: {
          handlePaste: (view, event, slice) => {
            console.log('🔍 TipTap 내장 붙여넣기 차단');
            return true; // 내장 붙여넣기 처리 차단
          }
        }
      });

      // 복사/붙여넣기 이벤트 핸들러 추가
      const handlePaste = (event: ClipboardEvent) => {
        console.log('🔍 붙여넣기 이벤트 감지:', event);
        
        // 기본 붙여넣기 동작을 완전히 차단하고 커스텀 처리
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const clipboardData = event.clipboardData;
        if (clipboardData) {
          const text = clipboardData.getData('text/plain');
          const html = clipboardData.getData('text/html');
          
          console.log('🔍 붙여넣기 데이터:', { text, html });
          
          // HTML이 있는 경우 HTML로 붙여넣기, 그렇지 않으면 텍스트로 붙여넣기
          if (html && html.trim()) {
            // HTML 내용을 정리하여 붙여넣기
            const cleanHtml = cleanPastedHtml(html);
            editor.commands.insertContent(cleanHtml);
          } else if (text && text.trim()) {
            // 텍스트 내용을 그대로 붙여넣기
            editor.commands.insertContent(text);
          }
        }
      };

      const handleCopy = (event: ClipboardEvent) => {
        console.log('🔍 복사 이벤트 감지:', event);
        // 기본 복사 동작을 허용
      };

      const handleCut = (event: ClipboardEvent) => {
        console.log('🔍 잘라내기 이벤트 감지:', event);
        // 기본 잘라내기 동작을 허용
      };

      // 키보드 이벤트 핸들러 (URL 감지용)
      const handleKeyDown = (event: KeyboardEvent) => {
        // Enter 키가 눌렸을 때 URL 감지
        if (event.key === 'Enter') {
          const { from } = editor.state.selection;
          const textBefore = editor.state.doc.textBetween(0, from);
          
          // URL 감지 및 미리보기 생성
          if (detectAndCreateUrlPreview(textBefore)) {
            event.preventDefault();
            return;
          }
        }
      };

      // 에디터 DOM 요소에 이벤트 리스너 추가
      const editorElement = editor.view.dom;
      editorElement.addEventListener('paste', handlePaste);
      editorElement.addEventListener('copy', handleCopy);
      editorElement.addEventListener('cut', handleCut);
      editorElement.addEventListener('keydown', handleKeyDown);

      // 에디터가 파괴될 때 이벤트 리스너 제거
      return () => {
        editorElement.removeEventListener('paste', handlePaste);
        editorElement.removeEventListener('copy', handleCopy);
        editorElement.removeEventListener('cut', handleCut);
        editorElement.removeEventListener('keydown', handleKeyDown);
      };
    },
    immediatelyRender: false,
  });

  // content prop이 변경될 때 에디터 업데이트
  useEffect(() => {
    // editor가 없으면 실행하지 않음
    if (!editor) {
      console.log('🔍 editor가 없어서 useEffect 건너뜀');
      return;
    }
    
    console.log('🔍 useEffect 실행됨 - content:', content.substring(0, 100) + '...');
    console.log('🔍 useEffect 실행됨 - editor:', !!editor);
    

    // content가 에디터 HTML과 다를 때만 업데이트
    const currentEditorHTML = editor.getHTML();
    if (content !== currentEditorHTML) {
      console.log('🔍 content prop 변경됨, 에디터 업데이트:', content);
      console.log('🔍 현재 에디터 HTML:', currentEditorHTML);
      console.log('🔍 content와 에디터 HTML이 다른가?', content !== currentEditorHTML);
      
      // 커서 위치 보존을 위해 현재 선택 영역 저장
      const currentSelection = editor.state.selection;
      const currentPosition = currentSelection.from;
      
      // base64 이미지 데이터 검증 및 수정
      let processedContent = content;
      
      if (content.includes('<img') && content.includes('data:image/')) {
        console.log('🔍 Base64 이미지가 포함된 content 감지, 데이터 검증 시작');
        
        // base64 이미지 데이터 검증 및 수정
        processedContent = content.replace(/<img[^>]*src="data:image\/[^"]*"/g, (match) => {
          const srcMatch = match.match(/src="(data:image\/[^"]*)"/);
          if (srcMatch) {
            const base64Data = srcMatch[1];
            
            // base64 데이터 검증
            try {
              const base64Part = base64Data.split(',')[1];
              if (base64Part && base64Part.length % 4 === 0) {
                // 유효한 base64 데이터
                console.log('🔍 유효한 base64 이미지 데이터 확인');
                return match;
              } else {
                console.warn('🔍 손상된 base64 데이터 감지, 이미지 제거');
                return match.replace(/src="[^"]*"/, 'src=""');
              }
            } catch (err) {
              console.warn('🔍 Base64 데이터 파싱 실패, 이미지 제거');
              return match.replace(/src="[^"]*"/, 'src=""');
            }
          }
          return match;
        });
        
        if (processedContent !== content) {
          console.log('🔍 Base64 이미지 데이터 수정됨');
        }
      }
      
      // 수정된 content로 에디터 업데이트 (한 번만 호출)
      // 엔터 키 동작 정규화: 일관된 줄바꿈 처리
      let contentWithLineBreaks = processedContent;
      // 1. 빈 p 태그를 p br p로 변환 (단일 줄바꿈) - 줄간격 일관성을 위해 p 태그 유지
      contentWithLineBreaks = contentWithLineBreaks.replace(/<p><\/p>/g, '<p><br></p>');
      // 2. 연속된 빈 p 태그를 p br p br p로 변환 (이중 줄바꿈)
      contentWithLineBreaks = contentWithLineBreaks.replace(/<p><\/p><p><\/p>/g, '<p><br></p><p><br></p>');
      // 3. 남은 줄바꿈 문자 처리
      contentWithLineBreaks = contentWithLineBreaks.replace(/\n/g, '<br>');
      
      // 에디터 업데이트 후 커서 위치 복원
      editor.commands.setContent(contentWithLineBreaks, false, {
        preserveWhitespace: 'full',
        parseOptions: {
          preserveWhitespace: 'full'
        }
      });
      
      // 커서 위치 복원 (문서 길이 내에서)
      try {
        const docSize = editor.state.doc.content.size;
        const safePosition = Math.min(currentPosition, docSize);
        editor.commands.setTextSelection(safePosition);
      } catch (error) {
        console.warn('🔍 커서 위치 복원 실패:', error);
      }
    } else {
      console.log('🔍 content와 에디터 HTML이 동일하여 업데이트 건너뜀');
    }
  }, [content]);


  // 디버깅: 에디터 content 로그
  useEffect(() => {
    if (editor && content) {
      console.log('🔍 에디터 content 로드됨:', content.substring(0, 200) + '...');
      const editorContent = editor.getHTML();
      console.log('🔍 에디터 HTML:', editorContent.substring(0, 200) + '...');
    }
  }, [editor, content]);

  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setIsLinkModalOpen(false);
    }
  };

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run();
  };


  const addImage = () => {
    setIsImageModalOpen(true);
  };

  const insertImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setIsImageModalOpen(false);
      setImageUrl('');
    }
  };

  // 색상 적용 함수
  const applyColor = (color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
      setSelectedColor(color);
      setIsColorPickerOpen(false);
    }
  };

  // 색상 제거 함수
  const removeColor = () => {
    if (editor) {
      editor.chain().focus().unsetColor().run();
      setSelectedColor('#000000');
    }
  };

  // 폰트 패밀리 적용 함수
  const applyFontFamily = (fontFamily: string) => {
    if (editor) {
      // 현재 선택 영역 저장
      const currentSelection = editor.state.selection;
      const { from, to } = currentSelection;
      
      // 선택된 텍스트가 있는 경우
      if (from !== to) {
        // 선택 영역을 유지하면서 폰트 적용
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .setFontFamily(fontFamily)
          .run();
      } else {
        // 커서만 있는 경우 현재 위치에 폰트 적용
        editor.chain().focus().setFontFamily(fontFamily).run();
      }
      
      setSelectedFontFamily(fontFamily);
      setIsFontFamilyOpen(false);
    }
  };

  // 폰트 크기 적용 함수
  const applyFontSize = (fontSize: string) => {
    if (editor) {
      // 현재 선택 영역 저장
      const currentSelection = editor.state.selection;
      const { from, to } = currentSelection;
      
      // 선택된 텍스트가 있는 경우
      if (from !== to) {
        // 선택 영역을 유지하면서 폰트 크기 적용
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .setFontSize(fontSize)
          .run();
      } else {
        // 커서만 있는 경우 현재 위치에 폰트 크기 적용
        editor.chain().focus().setFontSize(fontSize).run();
      }
      
      setSelectedFontSize(fontSize);
      setIsFontSizeOpen(false);
    }
  };

  // 사용자 정의 폰트 추가 함수
  const addCustomFont = () => {
    if (customFontInput.trim() && !customFonts.includes(customFontInput.trim())) {
      const newFonts = [...customFonts, customFontInput.trim()];
      setCustomFonts(newFonts);
      
      // localStorage에 저장
      try {
        localStorage.setItem('richTextEditor-customFonts', JSON.stringify(newFonts));
        console.log('🔍 사용자 정의 폰트 저장됨:', newFonts);
      } catch (error) {
        console.warn('사용자 정의 폰트 저장 실패:', error);
      }
      
      setCustomFontInput('');
      setIsCustomFontOpen(false);
    }
  };

  // 사용자 정의 폰트 제거 함수
  const removeCustomFont = (font: string) => {
    const newFonts = customFonts.filter(f => f !== font);
    setCustomFonts(newFonts);
    
    // localStorage 업데이트
    try {
      localStorage.setItem('richTextEditor-customFonts', JSON.stringify(newFonts));
      console.log('🔍 사용자 정의 폰트 삭제됨:', font, '남은 폰트:', newFonts);
    } catch (error) {
      console.warn('사용자 정의 폰트 삭제 실패:', error);
    }
  };


  if (!isMounted || !editor) {
    return (
      <div className="border border-gray-300 rounded-lg">
        <div className="p-4 text-center text-gray-500">
          에디터를 로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* 툴바 - 고정 */}
      <div 
        className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 flex flex-wrap gap-1"
        onClick={(e) => {
          // 툴바 클릭 시 커서 위치 보존
          e.preventDefault();
        }}
      >
        {/* 텍스트 스타일 */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('bold') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('italic') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('underline') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleUnderline().run();
            }}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('strike') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('strike') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('code') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('code') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        {/* 제목 버튼 */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        {/* 색상 선택 */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <div className="relative color-picker-container">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
            >
              <div className="flex items-center gap-1">
                <div 
                  className="w-4 h-4 rounded border border-gray-300" 
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <Type className="w-4 h-4" />
              </div>
            </Button>
            
            {isColorPickerOpen && (
              <div className="absolute top-full left-0 mt-1 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] min-w-[400px]">
                <div className="grid grid-cols-10 gap-2 mb-3">
                  {[
                    // 기본 색상 (검정, 회색 계열)
                    '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
                    // 빨간색 계열
                    '#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFCCCC',
                    // 주황색 계열
                    '#FF6600', '#FF8833', '#FFAA66', '#FFCC99', '#FFEECC',
                    // 노란색 계열
                    '#FFCC00', '#FFDD33', '#FFEE66', '#FFFF99', '#FFFFCC',
                    // 초록색 계열
                    '#00FF00', '#33FF33', '#66FF66', '#99FF99', '#CCFFCC',
                    // 파란색 계열
                    '#0066FF', '#3388FF', '#66AAFF', '#99CCFF', '#CCEEFF',
                    // 보라색 계열
                    '#6600FF', '#8833FF', '#AA66FF', '#CC99FF', '#EECCFF',
                    // 분홍색 계열
                    '#FF00FF', '#FF33FF', '#FF66FF', '#FF99FF', '#FFCCFF',
                    // 청록색 계열
                    '#00FFFF', '#33FFFF', '#66FFFF', '#99FFFF', '#CCFFFF',
                    // 갈색 계열
                    '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3',
                    // 핫핑크 계열
                    '#FF69B4', '#FF7FB3', '#FF95C2', '#FFABD1', '#FFC1E0',
                    // 라임 계열
                    '#32CD32', '#7CFC00', '#ADFF2F', '#9AFF9A', '#F0FFF0',
                    // 골드 계열
                    '#FFD700', '#FFE55C', '#FFEC8C', '#FFF3BC', '#FFF9EC',
                    // 네이비 계열
                    '#000080', '#191970', '#4169E1', '#6495ED', '#87CEEB',
                    // 마젠타 계열
                    '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB', '#FFE4E1',
                    // 올리브 계열
                    '#808000', '#9ACD32', '#ADFF2F', '#7FFF00', '#7CFC00'
                  ].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform shadow-sm"
                      style={{ backgroundColor: color }}
                      onClick={() => applyColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">커스텀:</span>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => applyColor(e.target.value)}
                      className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeColor}
                    className="text-xs px-3 py-1"
                  >
                    기본색
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 폰트 패밀리 선택 */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <div className="relative font-family-container">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={() => setIsFontFamilyOpen(!isFontFamilyOpen)}
            >
              <div className="flex items-center gap-1">
                <Type className="w-4 h-4" />
                <span className="text-xs" style={{ fontFamily: selectedFontFamily }}>
                  {selectedFontFamily}
                </span>
              </div>
            </Button>
            
            {isFontFamilyOpen && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] min-w-[250px]">
                {/* 기본 폰트 목록 */}
                <div className="space-y-1 mb-3">
                  <div className="text-xs font-semibold text-gray-500 mb-2">기본 폰트</div>
                  {[
                    'Inter', 'Pretendard', 'Arial', 'Times New Roman', 'Georgia', 'Verdana', 
                    'Helvetica', 'Courier New', 'Trebuchet MS', 'Arial Black'
                  ].map((font) => (
                    <button
                      key={font}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      style={{ fontFamily: font }}
                      onClick={() => applyFontFamily(font)}
                    >
                      {font}
                    </button>
                  ))}
                </div>

                {/* 사용자 정의 폰트 목록 */}
                {customFonts.length > 0 && (
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-500">사용자 정의 폰트</div>
                      <div className="text-xs text-green-600">💾 저장됨</div>
                    </div>
                    {customFonts.map((font) => (
                      <div key={font} className="flex items-center justify-between group">
                        <button
                          className="flex-1 text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                          style={{ fontFamily: font }}
                          onClick={() => applyFontFamily(font)}
                        >
                          {font}
                        </button>
                        <button
                          className="ml-2 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeCustomFont(font)}
                          title="폰트 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 폰트 추가 섹션 */}
                <div className="border-t pt-3">
                  <div className="text-xs font-semibold text-gray-500 mb-2">폰트 추가</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customFontInput}
                      onChange={(e) => setCustomFontInput(e.target.value)}
                      placeholder="폰트 이름 입력"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addCustomFont()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCustomFont}
                      disabled={!customFontInput.trim()}
                      className="px-3 py-2 text-xs"
                    >
                      추가
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    예: "Noto Sans KR", "Roboto", "Open Sans"
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 폰트 크기 선택 */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <div className="relative font-size-container">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={() => setIsFontSizeOpen(!isFontSizeOpen)}
            >
              <div className="flex items-center gap-1">
                <Type className="w-4 h-4" />
                <span className="text-xs" style={{ fontFamily: selectedFontFamily, fontSize: selectedFontSize }}>
                  {selectedFontSize}
                </span>
              </div>
            </Button>
            
            {isFontSizeOpen && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] min-w-[120px]">
                <div className="space-y-1">
                  {['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'].map((size) => (
                    <button
                      key={size}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      style={{ fontSize: size }}
                      onClick={() => applyFontSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>




        {/* 리스트 */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('bulletList') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('orderedList') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('blockquote') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('blockquote') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>
        </div>

        {/* 링크 및 이미지 */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive('link') ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive('link') ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => setIsLinkModalOpen(true)}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          {editor.isActive('link') && (
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={removeLink}
            >
              <Unlink className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={addImage}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* 정렬 */}
        <div className="flex gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'outline'}
            size="sm"
            className={editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>


        {/* 실행 취소/다시 실행 */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 에디터 - 스크롤 가능 */}
      <div className="text-[14px] max-h-[700px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* 링크 모달 */}
      {isLinkModalOpen && createPortal(
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full mx-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">링크 추가</h3>
                <button
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setLinkUrl('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL 입력
                </label>
                <input
                  type="url"
                  placeholder="URL을 입력하세요"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-[14px]"
                  onKeyPress={(e) => e.key === 'Enter' && addLink()}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setLinkUrl('');
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                >
                  취소
                </Button>
                <Button
                  onClick={addLink}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  추가
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 이미지 모달 */}
      {isImageModalOpen && createPortal(
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full mx-6 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">이미지 추가</h3>
                <button
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setImageUrl('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
                >
                  ×
                </button>
              </div>
            

            {/* URL 직접 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 URL 입력
              </label>
              <input
                type="url"
                placeholder="이미지 URL을 입력하세요"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-[14px]"
              />
            </div>

              {/* 미리보기 */}
              {imageUrl && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    미리보기
                  </label>
                  <div className="border border-gray-300 rounded-xl p-4 bg-gray-50">
                    <img
                      src={imageUrl}
                      alt="이미지 미리보기"
                      className="max-w-full h-auto max-h-48 object-contain mx-auto rounded-lg shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="text-center text-gray-500 py-8 bg-gray-100 rounded-lg"><div class="text-2xl mb-2">📷</div><div>이미지를 불러올 수 없습니다</div></div>';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setImageUrl('');
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                >
                  취소
                </Button>
                <Button 
                  onClick={insertImage}
                  disabled={!imageUrl}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  추가
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
