import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

describe('ToastContext', () => {
  test('throws error when useToast is used outside ToastProvider', () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within a ToastProvider');
  });

  test('provides initial state with empty toasts array', () => {
    const wrapper = ({ children }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    
    const { result } = renderHook(() => useToast(), { wrapper });
    
    expect(result.current.toasts).toEqual([]);
  });

  test('adds toast with addToast function', () => {
    const wrapper = ({ children }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    
    const { result } = renderHook(() => useToast(), { wrapper });
    
    act(() => {
      result.current.addToast('Test message', 'success', 0);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Test message',
      type: 'success',
      duration: 0
    });
    expect(result.current.toasts[0].id).toBeDefined();
  });

  test('removes toast with removeToast function', () => {
    const wrapper = ({ children }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    
    const { result } = renderHook(() => useToast(), { wrapper });
    
    let toastId;
    act(() => {
      toastId = result.current.addToast('Test message', 'info', 0);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    act(() => {
      result.current.removeToast(toastId);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  test('clears all toasts with clearToasts function', () => {
    const wrapper = ({ children }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    
    const { result } = renderHook(() => useToast(), { wrapper });
    
    act(() => {
      result.current.addToast('Message 1', 'info', 0);
      result.current.addToast('Message 2', 'success', 0);
    });
    
    expect(result.current.toasts).toHaveLength(2);
    
    act(() => {
      result.current.clearToasts();
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  test('adds toast using convenience methods', () => {
    const wrapper = ({ children }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    
    const { result } = renderHook(() => useToast(), { wrapper });
    
    act(() => {
      result.current.showToast.success('Success message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Success message',
      type: 'success'
    });
  });
});