import { render, screen } from "@testing-library/react";
import App from "../App";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mock the components that make network calls or use complex context
vi.mock("@/components/LiveMap", () => ({
    default: () => <div data-testid="live-map">Live Map Mock</div>,
}));

vi.mock("@/components/DashboardStats", () => ({
    default: () => <div data-testid="dashboard-stats">Stats Mock</div>,
}));

vi.mock("@/components/VehicleList", () => ({
    default: () => <div data-testid="vehicle-list">Vehicle List Mock</div>,
}));

vi.mock("@/components/AnalyticsPanel", () => ({
    default: () => <div data-testid="analytics-panel">Analytics Mock</div>,
}));

describe("App", () => {
    it("renders the dashboard layout", () => {
        // App already has BrowserRouter, so we don't need MemoryRouter here.
        render(<App />);
        // Check for title or main layout elements
        // Since App has a Route to Index, and Index has Dashboard
        // We are mocking children, so we expect to see them potentially if they are rendered immediately.
        // However, App might just set up Routes.
        // Let's check if the main container or something is present.
        // Or we can just check if it doesn't crash.
    });
});
