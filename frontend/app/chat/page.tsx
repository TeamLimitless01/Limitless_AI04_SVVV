"use client";

import { memo, useRef, useEffect, useState } from "react";
import { Bot, Trash2, Send, Loader2, Zap, Sparkles, Code, Briefcase, GraduationCap, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useChat } from "./useChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const VoidLogo: React.FC = () => (
  <div className="relative flex items-center justify-center">
    <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full animate-pulse" />
    <Zap className="h-5 w-5 text-white fill-white relative z-10" strokeWidth={2.5} />
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
  li: (props: any) => <li className="text-[0.95rem] md:text-base">{props.children}</li>,
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
      title: "Mock Interview",
      description: "Practice technical rounds for Senior Frontend roles.",
      icon: <Code className="h-5 w-5 text-blue-500" />,
      text: "Conduct a 15-minute mock technical interview for a Senior Frontend Developer role, focusing on React and System Design."
    },
    {
      title: "Resume Review",
      description: "Get targeted feedback for FAANG companies.",
      icon: <Briefcase className="h-5 w-5 text-purple-500" />,
      text: "I want to improve my resume for FAANG companies. Can you review it if I paste the content here, or give me some high-level tips first?"
    },
    {
      title: "Deep Concepts",
      description: "Understand complex topics simply.",
      icon: <GraduationCap className="h-5 w-5 text-indigo-500" />,
      text: "Explain the difference between Shadow DOM and Virtual DOM in simple terms, with examples of when each is used."
    },
    {
      title: "Salary Negotiation",
      description: "Expert advice on final stage talks.",
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      text: "Help me prepare for a salary negotiation for a Software Engineer position after receiving an offer. What points should I focus on?"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
          <Sparkles className="h-3 w-3" />
          <span>Next Generation AI Career Partner</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Elevate Your <span className="text-gradient">Career Path</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">
          Your personal AI mentor for technical growth, interview mastery, and career strategic planning.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prompts.map((p, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onPromptSelect(p.text)}
              className="group p-5 text-left glass-card hover:bg-white dark:hover:bg-slate-800/80 transition-all rounded-2xl flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                {p.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{p.title}</h3>
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

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-500/20 transform -translate-y-2">
          <VoidLogo />
        </div>
      )}
      <div
        className={`relative max-w-[85%] md:max-w-3xl p-5 md:p-6 rounded-3xl shadow-xl transition-all ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/20"
            : "glass-card rounded-tl-none"
        }`}
      >
        <div className="max-w-none">
          <ReactMarkdown
            components={MarkdownComponents}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div
          className={`text-[10px] mt-4 font-medium uppercase tracking-wider flex items-center gap-2 ${
            isUser ? "text-blue-100/70" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {isUser ? "You" : "Neura AI"}
          <span className="opacity-40">•</span>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isUser && (
        <div className="w-9 h-9 md:w-11 md:h-11 flex-shrink-0 rounded-2xl bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white text-lg font-bold shadow-lg transform -translate-y-2">
          <UserCircle className="h-6 w-6 opacity-30" />
        </div>
      )}
    </motion.div>
  );
};

const ChatInput: React.FC<{
  onSend: (content: string) => void;
  isLoading: boolean;
}> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto p-2 glass-card rounded-2xl border-white/20 shadow-2xl pointer-events-auto flex gap-2 items-center"
      >
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          className="flex-1 h-14 bg-transparent border-none shadow-none focus-visible:ring-0 text-base px-6 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`h-12 w-12 rounded-xl transition-all duration-300 flex-shrink-0 ${
            input.trim() ? "bg-blue-600 hover:bg-blue-700 scale-100" : "bg-slate-200 dark:bg-slate-800 scale-95"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
};

const AIChat = memo(() => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialScroll, setInitialScroll] = useState(false);

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

  const lastMessageIndex = messages.length - 1;
  const isLastMessageAssistant =
    messages.length > 0 && messages[lastMessageIndex]?.role === "assistant";

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#020617] selection:bg-blue-500/30 overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 dark:bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex-1 mt-14 flex flex-col">
          <ScrollArea className="flex-1 h-[calc(100vh-140px)] px-4 md:px-6">
            <div className="max-w-5xl mx-auto pt-8 pb-32">
              <AnimatePresence mode="wait">
                {messages.length === 0 ? (
                  <QuickPrompts key="prompts" onPromptSelect={sendMessage} />
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-12"
                  >
                    <div className="flex justify-between items-center py-4 sticky top-0 bg-white/10 dark:bg-[#020617]/10 backdrop-blur-xl z-20 mb-8 border-b border-slate-200/50 dark:border-slate-800/50 px-2 rounded-xl">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span>Neura</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                          {messages.length} Messages Active
                        </p>
                      </div>
                      <Button
                        onClick={clearMessages}
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reset Session
                      </Button>
                    </div>

                    <div className="space-y-12">
                      {messages?.map((message, i) => {
                        const isLastVisibleElement =
                          (i === lastMessageIndex && !isLoading) ||
                          (i === lastMessageIndex && isLastMessageAssistant);

                        return (
                          <div
                            key={message.id || i}
                            ref={isLastVisibleElement ? messagesEndRef : null}
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
                  className="flex gap-4 mt-12"
                  ref={!isLastMessageAssistant ? messagesEndRef : null}
                >
                  <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 transform -translate-y-2">
                    <VoidLogo />
                  </div>
                  <div className="glass-card rounded-2xl rounded-tl-none p-6 shadow-2xl border-white/20">
                    <div className="flex items-center gap-5">
                      <LoadingDots size="md" />
                    
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
});

AIChat.displayName = "AIChat";

export default function Page() {
  return <AIChat />;
}
