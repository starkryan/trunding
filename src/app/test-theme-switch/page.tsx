"use client"

import { useEffect, useState, useId } from "react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FaSun, FaMoon } from "react-icons/fa";

export default function TestThemeSwitchPage() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync isDarkMode with actual theme
  useEffect(() => {
    if (mounted) {
      const actualTheme = theme === 'system' ? systemTheme : theme;
      setIsDarkMode(actualTheme === 'dark');
    }
  }, [theme, systemTheme, mounted]);

  // Handle theme switching
  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDarkMode(checked);
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Show loading state while checking theme
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading theme...</div>
        </div>
      </div>
    );
  }

  const actualTheme = theme === 'system' ? systemTheme : theme;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Theme Switch Test</h1>
            <p className="text-muted-foreground">Testing the fixed theme switching functionality</p>
          </div>

          {/* Current Theme Info */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Current Theme State</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Hook Theme:</span> {theme}
              </div>
              <div>
                <span className="font-medium">System Theme:</span> {systemTheme}
              </div>
              <div>
                <span className="font-medium">Actual Theme:</span> {actualTheme}
              </div>
              <div>
                <span className="font-medium">isDarkMode State:</span> {isDarkMode.toString()}
              </div>
            </div>
          </div>

          {/* Original Profile Switch */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Profile Page Switch (Fixed)</h2>
            <div className="space-y-2">
              <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">Theme</Label>
              <div className="flex items-center space-x-3">
                <div className="relative inline-grid h-9 grid-cols-[1fr_1fr] items-center text-sm font-medium">
                  <Switch
                    id={id}
                    checked={isDarkMode}
                    onCheckedChange={handleThemeChange}
                    className="peer data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto rounded-md [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-sm [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-full [&_span]:data-[state=checked]:rtl:-translate-x-full"
                  />
                  <span className="pointer-events-none relative ms-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full peer-data-[state=unchecked]:rtl:-translate-x-full">
                    <span className="text-[10px] font-medium uppercase">Light</span>
                  </span>
                  <span className="peer-data-[state=checked]:text-background pointer-events-none relative me-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:-translate-x-full peer-data-[state=unchecked]:invisible peer-data-[state=checked]:rtl:translate-x-full">
                    <span className="text-[10px] font-medium uppercase">Dark</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Toggle Button */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Simple Toggle Button</h2>
            <Button
              variant="outline"
              onClick={handleToggleTheme}
              className="flex items-center gap-2"
            >
              <FaSun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <FaMoon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              Toggle to {theme === 'light' ? 'Dark' : 'Light'}
            </Button>
          </div>

          {/* Visual Theme Indicator */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Visual Theme Indicator</h2>
            <div className={`p-8 rounded-lg border-2 ${
              actualTheme === 'dark'
                ? 'bg-gray-900 text-white border-gray-700'
                : 'bg-gray-100 text-gray-900 border-gray-300'
            }`}>
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {actualTheme === 'dark' ? '🌙' : '☀️'}
                </div>
                <div className="font-medium">
                  Current visual theme: {actualTheme === 'dark' ? 'DARK' : 'LIGHT'}
                </div>
                <div className="text-sm opacity-75 mt-1">
                  Switch state: {isDarkMode ? 'DARK (checked)' : 'LIGHT (unchecked)'}
                </div>
              </div>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="bg-muted rounded-lg p-6">
            <h3 className="font-semibold mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Check the "Current Theme State" section to see all theme values</li>
              <li>Use the Profile Page Switch to toggle between light and dark themes</li>
              <li>Use the Simple Toggle Button as an alternative method</li>
              <li>Verify that the switch position always matches the actual theme</li>
              <li>The visual indicator should update immediately and correctly</li>
              <li>No more mismatch between switch state and actual theme!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}