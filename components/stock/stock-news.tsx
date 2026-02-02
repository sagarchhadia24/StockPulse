import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockNews } from "@/types";

interface StockNewsListProps {
  news: StockNews[];
}

export function StockNewsList({ news }: StockNewsListProps) {
  if (news.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest News</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent news available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest News</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <h3 className="font-medium line-clamp-2">{item.title}</h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>{item.source}</span>
                <span>-</span>
                <span>
                  {new Date(item.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
