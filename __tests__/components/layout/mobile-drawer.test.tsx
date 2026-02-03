import { render, screen, fireEvent } from "@testing-library/react";
import { MobileDrawer } from "@/components/layout/mobile-drawer";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) {
    return (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    );
  };
});

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  }),
}));

describe("MobileDrawer", () => {
  it("renders hamburger button", () => {
    render(<MobileDrawer />);
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("opens drawer when hamburger is clicked", () => {
    render(<MobileDrawer />);

    const hamburger = screen.getByLabelText("Open menu");
    fireEvent.click(hamburger);

    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
  });

  it("closes drawer when X is clicked", () => {
    render(<MobileDrawer />);

    // Open drawer
    fireEvent.click(screen.getByLabelText("Open menu"));

    // Close drawer
    fireEvent.click(screen.getByLabelText("Close menu"));

    // Drawer should be closed (translate-x applied to parent drawer container)
    const closeButton = screen.getByLabelText("Close menu");
    const drawerHeader = closeButton.closest("div");
    const drawer = drawerHeader?.parentElement;
    expect(drawer).toHaveClass("-translate-x-full");
  });

  it("renders all navigation links", () => {
    render(<MobileDrawer />);

    // Open drawer
    fireEvent.click(screen.getByLabelText("Open menu"));

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Watchlist")).toBeInTheDocument();
    expect(screen.getByText("Alerts")).toBeInTheDocument();
    expect(screen.getByText("Compare")).toBeInTheDocument();
    expect(screen.getByText("Undervalued")).toBeInTheDocument();
    expect(screen.getByText("Overvalued")).toBeInTheDocument();
    expect(screen.getByText("Sectors")).toBeInTheDocument();
    expect(screen.getByText("Screener")).toBeInTheDocument();
  });

  it("closes drawer when Escape is pressed", () => {
    render(<MobileDrawer />);

    // Open drawer
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });

    // Check drawer moved off-screen (translate-x applied to parent drawer container)
    const closeButton = screen.getByLabelText("Close menu");
    const drawerHeader = closeButton.closest("div");
    const drawer = drawerHeader?.parentElement;
    expect(drawer).toHaveClass("-translate-x-full");
  });
});
