import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button'; // Adjust path as necessary

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText(/Click Me/i);
    expect(buttonElement).toBeInTheDocument();
  });

  test('applies default button classes for primary variant and md size', () => {
    render(<Button>Default Button</Button>);
    const buttonElement = screen.getByText(/Default Button/i);
    // Check for a subset of expected classes from base, primary variant, and md size
    expect(buttonElement).toHaveClass('font-medium', 'rounded-md', 'bg-blue-600', 'text-white', 'hover:bg-blue-700', 'px-4', 'py-2', 'text-sm');
  });

  test('applies custom className along with default classes', () => {
    render(<Button className="custom-class">Custom Class Button</Button>);
    const buttonElement = screen.getByText(/Custom Class Button/i);
    expect(buttonElement).toHaveClass('custom-class');
    // Check that default classes are also present
    expect(buttonElement).toHaveClass('font-medium', 'bg-blue-600', 'px-4', 'py-2');
  });

  test('handles onClick event', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const buttonElement = screen.getByText(/Clickable/i);
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const buttonElement = screen.getByText(/Disabled Button/i);
    expect(buttonElement).toBeDisabled();
    // Check for disabled styling classes that result from `disabled:opacity-50 disabled:cursor-not-allowed`
    // These exact classes should be present on the element when disabled
    expect(buttonElement).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  test('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled Click</Button>);
    const buttonElement = screen.getByText(/Disabled Click/i);
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });

});
