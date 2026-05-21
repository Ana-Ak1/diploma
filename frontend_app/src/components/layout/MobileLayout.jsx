import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import MiniAIChat from "../ai/MiniAIChat";

export default function MobileLayout({ title, children }) {
  return (
    <>
      <div className="app-shell">
        <TopBar title={title} />
        <main className="screen-content">{children}</main>
        <MiniAIChat />
      </div>
      <BottomNav />
    </>
  );
}