"use client";

import { memo, useRef, useEffect, useState } from "react";
import {
  Trash2,
  Send,
  Loader2,
  Zap,
  Sparkles,
  Code,
  Briefcase,
  GraduationCap,
  UserCircle,
  History,
  Plus,
  X,
  ImagePlus,
  FileCheck2,
  ArrowUpRight,
  Download,
  Map,
  LayoutDashboard,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useChat } from "./useChat";
import type { ChatContentPart, ChatMessage } from "./useChat";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

const VoidLogo: React.FC = () => (
  <div className="relative flex items-center justify-center">
    <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full animate-pulse" />
    <Zap
      className="h-5 w-5 text-white fill-white relative z-10"
      strokeWidth={2.5}
    />
  </div>
);

const LoadingDots: React.FC<{ size: "sm" | "md" }> = ({ size }) => (
  <div className={`flex space-x-1.5 ${size === "md" ? "p-1" : "p-0.5"}`}>
    {[0, 0.2, 0.4].map((delay, i) => (
      <motion.div
        key={i}
        initial={{ y: 0 }}
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 1, repeat: Infinity, delay }}
        className={`${
          size === "md" ? "w-2 h-2" : "w-1.5 h-1.5"
        } bg-blue-500 rounded-full`}
      />
    ))}
  </div>
);

const MarkdownComponents: object = {
  a: (props: any) => (
    <a
      href={props.href}
      className="text-blue-500 hover:text-blue-600 transition-colors underline decoration-blue-500/30 underline-offset-4"
      target={props.href?.startsWith("http") ? "_blank" : "_self"}
      rel="noopener noreferrer"
    >
      {props.children}
    </a>
  ),
  p: (props: any) => (
    <p className="mb-4 last:mb-0 text-[0.95rem] md:text-base leading-relaxed text-slate-700 dark:text-slate-300">
      {props.children}
    </p>
  ),
  h1: (props: any) => (
    <h1 className="text-2xl font-bold mt-8 mb-4 tracking-tight text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
      {props.children}
    </h1>
  ),
  h2: (props: any) => (
    <h2 className="text-xl font-bold mt-6 mb-3 tracking-tight text-slate-800 dark:text-slate-200">
      {props.children}
    </h2>
  ),
  h3: (props: any) => (
    <h3 className="text-lg font-semibold mt-5 mb-2 text-slate-700 dark:text-slate-300">
      {props.children}
    </h3>
  ),
  ul: (props: any) => (
    <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
      {props.children}
    </ul>
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-outside ml-5 mb-4 space-y-2">
      {props.children}
    </ol>
  ),
  li: (props: any) => (
    <li className="text-[0.95rem] md:text-base">{props.children}</li>
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-blue-500/50 pl-4 py-2 italic text-slate-600 dark:text-slate-400 my-6 bg-blue-50/50 dark:bg-blue-500/5 rounded-r-xl">
      {props.children}
    </blockquote>
  ),
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <div className="relative group my-6">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
          className="rounded-xl !bg-slate-950/90 !p-4 border border-slate-800 shadow-2xl relative"
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code
        className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-sm font-mono text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700"
        {...props}
      >
        {children}
      </code>
    );
  },
};

const QuickPrompts: React.FC<{ onPromptSelect: (prompt: string) => void }> = ({
  onPromptSelect,
}) => {
  const prompts = [
    {
      title: "ATS Resume Check",
      description: "Get an honest, role-specific ATS-style review.",
      icon: <FileCheck2 className="h-5 w-5 text-emerald-500" />,
      text: "I want an ATS-style resume review. Please ask me to share my resume text and the target job description or role. Treat any score as an estimate, not a real ATS result.",
    },
    {
      title: "Mock Interview",
      description: "Practice technical rounds for Senior Frontend roles.",
      icon: <Code className="h-5 w-5 text-blue-500" />,
      text: "Conduct a 15-minute mock technical interview for a Senior Frontend Developer role, focusing on React and System Design.",
    },
    {
      title: "Resume Review",
      description: "Get targeted feedback for FAANG companies.",
      icon: <Briefcase className="h-5 w-5 text-purple-500" />,
      text: "Help me improve my resume for a target role. Ask me to paste my resume and the job description, then suggest truthful, specific edits without inventing experience or metrics.",
    },
    {
      title: "Deep Concepts",
      description: "Understand complex topics simply.",
      icon: <GraduationCap className="h-5 w-5 text-indigo-500" />,
      text: "Explain the difference between Shadow DOM and Virtual DOM in simple terms, with examples of when each is used.",
    },
    {
      title: "Salary Negotiation",
      description: "Expert advice on final stage talks.",
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      text: "Help me prepare for a salary negotiation for a Software Engineer position after receiving an offer. What points should I focus on?",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-3 md:px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
          <Sparkles className="h-3 w-3" />
          <span>Next Generation AI Career Partner</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 md:mb-6">
          Elevate Your <span className="text-gradient">Career Path</span>
        </h1>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 md:mb-12">
          Your personal AI mentor for technical growth, interview mastery, and
          career strategic planning.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {prompts.map((p, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onPromptSelect(p.text)}
              className="group min-h-24 p-4 md:p-5 text-left glass-card hover:bg-white dark:hover:bg-slate-800/80 transition-all rounded-2xl flex items-start gap-3 md:gap-4"
            >
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                {p.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === "user";
  const parts = Array.isArray(message.content) ? message.content : [];
  const text =
    typeof message.content === "string"
      ? message.content
      : parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-2 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="hidden sm:flex w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0 items-center justify-center shadow-lg shadow-blue-500/20">
          <VoidLogo />
        </div>
      )}
      <div
        className={`relative min-w-0 max-w-[92%] sm:max-w-[88%] md:max-w-3xl p-3.5 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-xl transition-all ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/20"
            : "glass-card rounded-tl-none"
        }`}
      >
        {parts
          .filter((part) => part.type === "image_url")
          .map((part, index) => (
            <img
              key={`image-${index}`}
              src={part.type === "image_url" ? part.image_url.url : ""}
              alt="User attachment"
              className="mb-3 max-h-72 max-w-full rounded-xl border border-white/20 object-contain"
            />
          ))}
        {text && (
          <div className="max-w-none break-words [overflow-wrap:anywhere]">
            <ReactMarkdown
              components={MarkdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
        <div
          className={`text-[10px] mt-4 font-medium uppercase tracking-wider flex items-center gap-2 ${
            isUser ? "text-blue-100/70" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {isUser ? "You" : "Neura AI"}
          <span className="opacity-40">•</span>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      {isUser && (
        <div className="hidden sm:flex w-9 h-9 md:w-11 md:h-11 flex-shrink-0 rounded-2xl bg-slate-800 dark:bg-slate-700 items-center justify-center text-white text-lg font-bold shadow-lg">
          <UserCircle className="h-6 w-6 opacity-30" />
        </div>
      )}
    </motion.div>
  );
};

const ChatInput: React.FC<{
  onSend: (content: string | ChatContentPart[]) => void;
  isLoading: boolean;
  sidebarExpanded: boolean;
}> = ({ onSend, isLoading, sidebarExpanded }) => {
  const [input, setInput] = useState("");
  const [imageData, setImageData] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachImage = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be smaller than 5 MB.");
      return;
    }

    setIsProcessingImage(true);
    let source = "";
    try {
      const image = new Image();
      source = URL.createObjectURL(file);
      image.src = source;
      await image.decode();
      const scale = Math.min(
        1,
        1280 / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare this image for upload.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.75);
      if (compressed.length > 1_400_000) {
        throw new Error(
          "This image is still too large after compression. Choose a smaller image.",
        );
      }
      setImageData(compressed);
    } catch (error) {
      console.error("Could not process pasted image:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to process this image.",
      );
    } finally {
      if (source) URL.revokeObjectURL(source);
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || imageData) && !isLoading && !isProcessingImage) {
      const content: ChatContentPart[] = [];
      if (input.trim()) content.push({ type: "text", text: input.trim() });
      if (imageData)
        content.push({ type: "image_url", image_url: { url: imageData } });
      onSend(imageData ? content : input.trim());
      setInput("");
      setImageData("");
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );
    if (imageItem) {
      event.preventDefault();
      void attachImage(imageItem.getAsFile() || undefined);
    }
  };

  return (
    <div
      className={`fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-0 right-0 z-50 pointer-events-none px-2 sm:px-4 transition-[left] duration-200 ${
        sidebarExpanded ? "md:left-64" : "md:left-16"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto p-1.5 sm:p-2 glass-card rounded-2xl border-white/20 shadow-2xl pointer-events-auto"
      >
        {imageData && (
          <div className="px-3 pt-2">
            <div className="relative inline-block">
              <img
                src={imageData}
                alt="Image ready to send"
                className="h-16 w-16 rounded-lg object-cover"
              />
              <button
                type="button"
                aria-label="Remove attached image"
                onClick={() => setImageData("")}
                className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void attachImage(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="ghost"
            aria-label="Attach image"
            title="Attach or paste an image"
            disabled={isLoading || isProcessingImage}
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl shrink-0"
          >
            {isProcessingImage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </Button>
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            maxLength={12000}
            placeholder="Ask about your career, resume, or interviews..."
            disabled={isLoading}
            className="min-w-0 flex-1 h-12 sm:h-14 bg-transparent border-none shadow-none focus-visible:ring-0 text-base px-2 sm:px-3 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <Button
            type="submit"
            disabled={
              (!input.trim() && !imageData) || isLoading || isProcessingImage
            }
            aria-label="Send message"
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 flex-shrink-0 ${
              input.trim() || imageData
                ? "bg-blue-600 hover:bg-blue-700 scale-100"
                : "bg-slate-200 dark:bg-slate-800 scale-95"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="px-3 pb-1 text-[9px] sm:text-[10px] text-slate-500">
          Paste or attach an image. Avoid sharing sensitive details.
        </p>
      </form>
    </div>
  );
};

const AIChat = memo(() => {
  const {
    messages,
    sessions,
    activeSessionId,
    isLoading,
    isReady,
    sendMessage,
    createNewChat,
    selectSession,
    deleteSession,
    clearMessages,
    exportHistory,
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialScroll, setInitialScroll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navExpanded = sidebarExpanded || mobileSidebarOpen;

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: messages.length > 1 ? "smooth" : "auto",
          block: "end",
        });
      }
    };

    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current && !initialScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      setInitialScroll(true);
    }
  }, [messages, initialScroll]);

  useEffect(() => {
    setInitialScroll(false);
  }, [activeSessionId]);

  const lastMessageIndex = messages.length - 1;
  const isLastMessageAssistant =
    messages.length > 0 && messages[lastMessageIndex]?.role === "assistant";

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#020617] selection:bg-blue-500/30 overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-600/5 blur-[120px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 dark:bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      <div
        className={`relative z-10 flex min-h-screen flex-col transition-[margin] duration-200 ${
          sidebarExpanded ? "md:ml-64" : "md:ml-16"
        }`}
      >
        <button
          type="button"
          aria-label={
            mobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={mobileSidebarOpen}
          onClick={() => setMobileSidebarOpen((open) => !open)}
          className="fixed left-3 top-28 z-[80] flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 md:hidden"
        >
          {mobileSidebarOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRightOpen className="h-5 w-5" />
          )}
        </button>
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-x-0 bottom-0 top-24 z-[60] bg-slate-950/40 backdrop-blur-[1px] md:hidden"
          />
        )}
        <aside
          aria-label="Chat navigation and actions"
          onMouseEnter={() => {
            if (window.matchMedia("(min-width: 768px)").matches)
              setSidebarExpanded(true);
          }}
          onMouseLeave={() => {
            if (window.matchMedia("(min-width: 768px)").matches)
              setSidebarExpanded(false);
          }}
          onFocus={() => {
            if (window.matchMedia("(min-width: 768px)").matches)
              setSidebarExpanded(true);
          }}
          onBlur={(event) => {
            if (
              window.matchMedia("(min-width: 768px)").matches &&
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            ) {
              setSidebarExpanded(false);
            }
          }}
          className={`fixed bottom-0 left-0 top-24 z-40 flex flex-col overflow-y-auto overflow-x-hidden border-r border-slate-200/70 bg-white/95 px-2 py-4 shadow-xl backdrop-blur-xl transition-[width,transform] duration-200 max-md:z-[70] dark:border-slate-800/70 dark:bg-slate-950/95 ${
            sidebarExpanded ? "w-64" : "w-16"
          } ${mobileSidebarOpen ? "max-md:w-72 max-md:translate-x-0" : "max-md:-translate-x-full"}`}
        >
          <button
            type="button"
            aria-label={
              sidebarExpanded
                ? "Collapse navigation sidebar"
                : "Expand navigation sidebar"
            }
            aria-expanded={sidebarExpanded}
            onClick={() => setSidebarExpanded((expanded) => !expanded)}
            className="mb-4 flex h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Zap className="h-5 w-5 shrink-0 text-blue-500" />
            <span
              className={`whitespace-nowrap text-sm font-bold transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
            >
              &nbsp;Neura Career Assistant
            </span>
          </button>
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span
              className={`whitespace-nowrap transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
            >
              Chat
            </span>
          </div>
          <nav aria-label="Chat actions" className="flex flex-col gap-1">
            <button
              onClick={() => {
                setShowHistory(true);
                setMobileSidebarOpen(false);
              }}
              title={navExpanded ? undefined : "Chat history"}
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
            >
              <History className="h-5 w-5 shrink-0" />
              <span
                className={`whitespace-nowrap transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
              >
                History ({sessions.length})
              </span>
            </button>
            <button
              onClick={() => {
                createNewChat();
                setMobileSidebarOpen(false);
              }}
              disabled={isLoading}
              title={navExpanded ? undefined : "New chat"}
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
            >
              <Plus className="h-5 w-5 shrink-0" />
              <span
                className={`whitespace-nowrap transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
              >
                New chat
              </span>
            </button>
            {messages.length > 0 && (
              <>
                <button
                  onClick={exportHistory}
                  title={navExpanded ? undefined : "Export conversation"}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                >
                  <Download className="h-5 w-5 shrink-0" />
                  <span
                    className={`whitespace-nowrap transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
                  >
                    Export chat
                  </span>
                </button>
                <button
                  onClick={clearMessages}
                  disabled={isLoading}
                  title={navExpanded ? undefined : "Delete conversation"}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                  <Trash2 className="h-5 w-5 shrink-0" />
                  <span
                    className={`whitespace-nowrap transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
                  >
                    Delete chat
                  </span>
                </button>
              </>
            )}
          </nav>
          <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span
              className={`whitespace-nowrap transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
            >
              Tools
            </span>
          </div>
          <nav aria-label="NeuraView tools" className="flex flex-col gap-1">
            {[
              { href: "/career", label: "Career Hub", icon: Briefcase },
              {
                href: "/ats-analyzer",
                label: "ATS Resume Analyzer",
                icon: FileCheck2,
              },
              {
                href: "/create-interview",
                label: "Mock Interview",
                icon: Code,
              },
              { href: "/roadmap-chat", label: "Learning Roadmap", icon: Map },
              { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
              {
                href: "/reports",
                label: "Interview Reports",
                icon: FileCheck2,
              },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                title={navExpanded ? undefined : label}
                className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span
                  className={`whitespace-nowrap transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
                >
                  {label}
                </span>
                {navExpanded && (
                  <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50" />
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-3 pb-2">
            <span
              className={`block whitespace-nowrap text-[10px] text-slate-400 transition-opacity duration-150 ${navExpanded ? "opacity-100" : "opacity-0"}`}
            >
              Your career companion
            </span>
          </div>
        </aside>

        {showHistory &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-x-0 bottom-0 top-24 z-[100] flex justify-start bg-slate-950/50 backdrop-blur-sm"
              onClick={(event) => {
                if (event.target === event.currentTarget) setShowHistory(false);
              }}
            >
              <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-history-title"
                className="flex h-full w-full max-w-sm flex-col border-r border-white/10 bg-white p-5 shadow-2xl dark:bg-slate-950"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2
                      id="chat-history-title"
                      className="text-lg font-bold text-slate-900 dark:text-white"
                    >
                      Chat history
                    </h2>
                    <p className="text-xs text-slate-500">
                      Saved only in this browser
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close history"
                    onClick={() => setShowHistory(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  className="mb-4 w-full"
                  onClick={() => {
                    createNewChat();
                    setShowHistory(false);
                  }}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" /> Start a new chat
                </Button>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                      Your saved conversations will appear here.
                    </p>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center gap-2 rounded-xl border p-2 ${
                          activeSessionId === session.id
                            ? "border-blue-500/50 bg-blue-500/10"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            selectSession(session.id);
                            setShowHistory(false);
                            setInitialScroll(false);
                          }}
                        >
                          <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {session.title}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {session.updatedAt.toLocaleDateString()} ·{" "}
                            {session.messages.length} messages
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${session.title}`}
                          disabled={isLoading && activeSessionId === session.id}
                          onClick={() => deleteSession(session.id)}
                        >
                          <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                  History is stored in local storage on this device. Clearing
                  browser data removes it.
                </p>
              </aside>
            </div>,
            document.body,
          )}

        <div className="mt-24 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="h-[calc(100dvh-8rem)] min-h-0 flex-1 overflow-hidden px-3 pt-12 sm:px-4 md:px-6 md:pt-0">
            <div className="mx-auto w-full min-w-0 max-w-5xl pt-4 sm:pt-8 pb-48 md:pb-36">
              <AnimatePresence mode="wait">
                {messages.length === 0 && !isReady ? (
                  <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" /> Restoring saved
                    chats...
                  </div>
                ) : messages.length === 0 ? (
                  <QuickPrompts key="prompts" onPromptSelect={sendMessage} />
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full min-w-0 space-y-8 sm:space-y-12"
                  >
                    <div className="w-full min-w-0 space-y-8 sm:space-y-12">
                      {messages?.map((message, i) => {
                        const isLastVisibleElement =
                          (i === lastMessageIndex && !isLoading) ||
                          (i === lastMessageIndex && isLastMessageAssistant);

                        return (
                          <div
                            key={message.id || i}
                            ref={isLastVisibleElement ? messagesEndRef : null}
                            className="w-full min-w-0"
                          >
                            <MessageBubble message={message} />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-w-0 gap-2 sm:gap-4 mt-8 sm:mt-12"
                  ref={!isLastMessageAssistant ? messagesEndRef : null}
                >
                  <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 transform -translate-y-2">
                    <VoidLogo />
                  </div>
                  <div className="glass-card min-w-0 rounded-2xl rounded-tl-none p-4 sm:p-6 shadow-2xl border-white/20">
                    <div className="flex items-center gap-3 sm:gap-5">
                      <LoadingDots size="md" />
                      <span className="text-sm text-slate-500">
                        Thinking through your request...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            sidebarExpanded={sidebarExpanded}
          />
        </div>
      </div>
    </div>
  );
});

AIChat.displayName = "AIChat";

export default function Page() {
  return <AIChat />;
}
