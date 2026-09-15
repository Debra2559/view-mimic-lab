import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { StoryWorld } from "@/components/story/StoryWorld";
import { LoginGateInline } from "@/components/story/LoginGate";
import { getPost } from "@/lib/feed";

/**
 * 世界线直达链接：朋友点开分享链接就直接进入剧情，不用先读回答。
 * 退出时回到对应的回答详情页（没有关联回答就回首页）。
 */
export const Route = createFileRoute("/world/$storyId")({
  head: () => ({
    meta: [
      { title: "进入这条世界线 · 看山画境" },
      {
        name: "description",
        content: "朋友分享给你的互动世界线：睁开眼睛，你的每个选择都会改写故事走向。",
      },
      { property: "og:title", content: "进入这条世界线 · 看山画境" },
      {
        property: "og:description",
        content: "朋友分享给你的互动世界线：睁开眼睛，你的每个选择都会改写故事走向。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorldPage,
});

function WorldPage() {
  const { storyId } = Route.useParams();
  const navigate = useNavigate();

  const exit = () => {
    if (getPost(storyId)) {
      navigate({ to: "/answer/$id", params: { id: storyId } });
    } else {
      navigate({ to: "/" });
    }
  };

  // 硬门禁：世界线（剧场）需要先登录知乎账号
  return (
    <LoginGateInline feature="这条世界线">
      <StoryWorld storyId={storyId} onExit={exit} />
    </LoginGateInline>
  );
}
