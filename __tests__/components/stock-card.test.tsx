import { render, screen } from "@testing-library/react";
import { StockCard } from "@/components/stock/stock-card";
import { StockWithScore } from "@/types";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Helper function to create a mock stock with score
function createMockStockWithScore(
  overrides: Partial<StockWithScore> = {}
): StockWithScore {
  return {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    price: 175.5,
    change: 3.25,
    changePercent: 1.89,
    marketCap: 2750000000000,
    peRatio: 28.5,
    pbRatio: 45.2,
    pegRatio: 2.1,
    week52High: 198.23,
    week52Low: 124.17,
    dividendYield: 0.51,
    volume: 52000000,
    avgVolume: 48000000,
    valueScore: 65,
    scoreBreakdown: {
      peScore: 60,
      pbScore: 55,
      pegScore: 45,
      weekPositionScore: 70,
    },
    dataQuality: "high",
    ...overrides,
  };
}

describe("StockCard", () => {
  describe("basic rendering", () => {
    it("renders stock symbol", () => {
      const stock = createMockStockWithScore({ symbol: "MSFT" });
      render(<StockCard stock={stock} />);

      expect(screen.getByText("MSFT")).toBeInTheDocument();
    });

    it("renders stock name", () => {
      const stock = createMockStockWithScore({ name: "Microsoft Corporation" });
      render(<StockCard stock={stock} />);

      expect(screen.getByText("Microsoft Corporation")).toBeInTheDocument();
    });

    it("renders stock price with dollar sign and two decimal places", () => {
      const stock = createMockStockWithScore({ price: 175.5 });
      render(<StockCard stock={stock} />);

      expect(screen.getByText("$175.50")).toBeInTheDocument();
    });

    it("renders P/E ratio", () => {
      const stock = createMockStockWithScore({ peRatio: 28.5 });
      render(<StockCard stock={stock} />);

      // P/E label and value are in separate elements
      expect(screen.getByText("28.5")).toBeInTheDocument();
      expect(screen.getByText(/P\/E:/)).toBeInTheDocument();
    });

    it('renders "N/A" when P/E ratio is null', () => {
      const stock = createMockStockWithScore({ peRatio: null });
      render(<StockCard stock={stock} />);

      // P/E label and N/A value are in separate elements
      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(screen.getByText(/P\/E:/)).toBeInTheDocument();
    });

    it("renders 52-week range", () => {
      const stock = createMockStockWithScore({
        week52Low: 100,
        week52High: 200,
      });
      render(<StockCard stock={stock} />);

      // RangeBar component renders low/high values and label separately
      expect(screen.getByText("$100")).toBeInTheDocument();
      expect(screen.getByText("$200")).toBeInTheDocument();
      expect(screen.getByText("52W Range")).toBeInTheDocument();
    });
  });

  describe("value score display", () => {
    it("displays the value score", () => {
      const stock = createMockStockWithScore({ valueScore: 75 });
      render(<StockCard stock={stock} />);

      expect(screen.getByText("75")).toBeInTheDocument();
    });

    it("renders ScoreRing with green color for undervalued stock (score >= 70)", () => {
      const stock = createMockStockWithScore({ valueScore: 75 });
      const { container } = render(<StockCard stock={stock} />);

      // ScoreRing uses green (#00dc82) for high scores
      const scoreCircle = container.querySelector('circle[stroke="#00dc82"]');
      expect(scoreCircle).toBeInTheDocument();
    });

    it("renders ScoreRing with yellow color for fair value stock (40-69)", () => {
      const stock = createMockStockWithScore({ valueScore: 55 });
      const { container } = render(<StockCard stock={stock} />);

      // ScoreRing uses yellow (#f59e0b) for medium scores
      const scoreCircle = container.querySelector('circle[stroke="#f59e0b"]');
      expect(scoreCircle).toBeInTheDocument();
    });

    it("renders ScoreRing with red color for overvalued stock (< 40)", () => {
      const stock = createMockStockWithScore({ valueScore: 30 });
      const { container } = render(<StockCard stock={stock} />);

      // ScoreRing uses red (#f87171) for low scores
      const scoreCircle = container.querySelector('circle[stroke="#f87171"]');
      expect(scoreCircle).toBeInTheDocument();
    });
  });

  describe("price change display", () => {
    it("shows positive change with green color and plus sign", () => {
      const stock = createMockStockWithScore({
        change: 5.25,
        changePercent: 3.1,
      });
      const { container } = render(<StockCard stock={stock} />);

      // PriceChange component shows value and percentage separately with dot separator
      expect(screen.getByText("+5.25")).toBeInTheDocument();
      expect(screen.getByText("+3.10%")).toBeInTheDocument();

      // Check for green color class (uses custom green #00dc82)
      const changeElement = container.querySelector(".text-\\[\\#00dc82\\]");
      expect(changeElement).toBeInTheDocument();
    });

    it("shows negative change with red color and minus sign", () => {
      const stock = createMockStockWithScore({
        change: -4.75,
        changePercent: -2.65,
      });
      const { container } = render(<StockCard stock={stock} />);

      // PriceChange component shows value and percentage separately
      expect(screen.getByText("-4.75")).toBeInTheDocument();
      expect(screen.getByText("-2.65%")).toBeInTheDocument();

      // Check for red color class (uses custom red #f87171)
      const changeElement = container.querySelector(".text-\\[\\#f87171\\]");
      expect(changeElement).toBeInTheDocument();
    });

    it("shows zero change with neutral styling", () => {
      const stock = createMockStockWithScore({
        change: 0,
        changePercent: 0,
      });
      const { container } = render(<StockCard stock={stock} />);

      // Zero values shown without plus sign
      expect(screen.getByText("0.00")).toBeInTheDocument();
      expect(screen.getByText("0.00%")).toBeInTheDocument();

      // Zero change uses neutral white/60 color
      const changeElement = container.querySelector(".text-white\\/60");
      expect(changeElement).toBeInTheDocument();
    });
  });

  describe("link to stock detail page", () => {
    it("links to the correct stock detail page", () => {
      const stock = createMockStockWithScore({ symbol: "GOOGL" });
      render(<StockCard stock={stock} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/stock/GOOGL");
    });

    it("wraps the entire card in a link", () => {
      const stock = createMockStockWithScore({ symbol: "NVDA" });
      render(<StockCard stock={stock} />);

      const link = screen.getByRole("link");
      // The link should contain the stock symbol
      expect(link).toContainElement(screen.getByText("NVDA"));
    });
  });

  describe("edge cases", () => {
    it("handles very long company names", () => {
      const stock = createMockStockWithScore({
        name: "Very Long Company Name That Should Be Truncated In Display",
      });
      render(<StockCard stock={stock} />);

      expect(
        screen.getByText(
          "Very Long Company Name That Should Be Truncated In Display"
        )
      ).toBeInTheDocument();
    });

    it("handles very small prices", () => {
      const stock = createMockStockWithScore({ price: 0.05 });
      render(<StockCard stock={stock} />);

      expect(screen.getByText("$0.05")).toBeInTheDocument();
    });

    it("handles large prices", () => {
      const stock = createMockStockWithScore({ price: 999999.99 });
      render(<StockCard stock={stock} />);

      expect(screen.getByText("$999999.99")).toBeInTheDocument();
    });

    it("handles minimum value score (0)", () => {
      const stock = createMockStockWithScore({ valueScore: 0 });
      render(<StockCard stock={stock} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles maximum value score (100)", () => {
      const stock = createMockStockWithScore({ valueScore: 100 });
      render(<StockCard stock={stock} />);

      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("handles stock with all null ratios", () => {
      const stock = createMockStockWithScore({
        peRatio: null,
        pbRatio: null,
        pegRatio: null,
      });
      render(<StockCard stock={stock} />);

      // P/E label and N/A value are in separate elements
      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(screen.getByText(/P\/E:/)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("is accessible via link", () => {
      const stock = createMockStockWithScore();
      render(<StockCard stock={stock} />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });
  });
});
