import { render, screen } from "@testing-library/react";
import { MoversTable } from "@/components/movers/movers-table";
import { MoverStock } from "@/lib/movers";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockGainers: MoverStock[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 150.0, change: 5.0, changePercent: 3.45 },
  { symbol: "MSFT", name: "Microsoft", price: 300.0, change: 8.0, changePercent: 2.74 },
];

const mockLosers: MoverStock[] = [
  { symbol: "TSLA", name: "Tesla Inc.", price: 200.0, change: -10.0, changePercent: -4.76 },
  { symbol: "META", name: "Meta Platforms", price: 350.0, change: -5.0, changePercent: -1.41 },
];

describe("MoversTable", () => {
  it("renders gainers with green styling", () => {
    render(<MoversTable stocks={mockGainers} type="gainers" />);

    expect(screen.getByText("Top Gainers")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("+3.45%")).toBeInTheDocument();
  });

  it("renders losers with red styling", () => {
    render(<MoversTable stocks={mockLosers} type="losers" />);

    expect(screen.getByText("Top Losers")).toBeInTheDocument();
    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(screen.getByText("-4.76%")).toBeInTheDocument();
  });

  it("links to stock detail page", () => {
    render(<MoversTable stocks={mockGainers} type="gainers" />);

    const link = screen.getByRole("link", { name: /AAPL/i });
    expect(link).toHaveAttribute("href", "/stock/AAPL");
  });

  it("shows empty state when no stocks", () => {
    render(<MoversTable stocks={[]} type="gainers" />);

    expect(screen.getByText("No gainers today")).toBeInTheDocument();
  });
});
