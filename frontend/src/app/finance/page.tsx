'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Edit, Trash2, DollarSign, TrendingDown, 
  CheckCircle, XCircle, Clock, Eye, Tag, Users, School
} from 'lucide-react';
import { PageWithBackground } from '@/components/PageWithBackground';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Finance {
  id: string;
  title: string;
  description?: string;
  amount: number;
  finance_type: 'income' | 'expense';
  category: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

interface Classroom {
  id: string;
  name: string;
  code: string;
  student_count?: number;
  tuition_per_session?: number;  // Học phí mỗi buổi (từ bảng classrooms)
  sessions_per_week?: number;    // Số buổi mỗi tuần (từ bảng classrooms)
  total_revenue?: number;
  total_paid?: number;  // Số tiền đã thu
  total_discount?: number;  // Số tiền chiết khấu
}

interface Student {
  id: string;
  student_code: string;
  user_id: string;
  classroom_id?: string;
  name?: string;
  payment_status?: 'paid' | 'pending';
  payment_amount?: number;  // Số tiền đã đóng
  discount_percent?: number;  // % chiết khấu
}

interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
}

export default function FinancePage() {
  const { user, loading: authLoading, logout } = useApiAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('expenses');

  // Expenses state
  const [expenses, setExpenses] = useState<Finance[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Finance | null>(null);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
  });

  // Revenue state (Classrooms)
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [refreshingClassrooms, setRefreshingClassrooms] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isPaymentHistoryDialogOpen, setIsPaymentHistoryDialogOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    payment_status: 'paid',
    receipt_number: '',
    notes: '',
    discount_percent: '0',  // Chiết khấu theo %
  });

  // Expense Categories state
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [loadingNextCode, setLoadingNextCode] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#6B7280',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      // Check both user from hook and localStorage
      const storedUser = localStorage.getItem('user');
      let currentRole = user?.role || '';
      
      if (!currentRole && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          currentRole = parsed.role || '';
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      // Normalize role to lowercase for comparison
      const normalizedRole = currentRole?.toLowerCase().trim();
      
      if (!user || normalizedRole !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Load expense categories
  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/expense-categories?is_active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Load expenses
  const loadExpenses = useCallback(async () => {
    try {
      setLoadingExpenses(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/finances?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Only show expenses
        const expenseData = data.filter((f: Finance) => f.finance_type === 'expense');
        setExpenses(expenseData);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  // Load classrooms with student count - OPTIMIZED: parallel API calls
  const loadClassrooms = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshingClassrooms(true);
      } else {
        setLoadingClassrooms(true);
      }
      const token = localStorage.getItem('auth_token');
      
      // Load all data in parallel for better performance
      const [classroomsResponse, studentsResponse, paymentsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/classrooms?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/api/students?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/api/payments?limit=10000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (classroomsResponse.ok) {
        const classroomsData = await classroomsResponse.json();
        
        let studentsData: Student[] = [];
        if (studentsResponse.ok) {
          studentsData = await studentsResponse.json();
        }

        let paymentsData: any[] = [];
        if (paymentsResponse.ok) {
          paymentsData = await paymentsResponse.json();
        }

        // Count students per classroom and calculate revenue - optimized calculation
        // Create maps for faster lookup
        const studentsByClassroom = new Map<string, Student[]>();
        studentsData.forEach((student: Student) => {
          if (student.classroom_id) {
            if (!studentsByClassroom.has(student.classroom_id)) {
              studentsByClassroom.set(student.classroom_id, []);
            }
            studentsByClassroom.get(student.classroom_id)!.push(student);
          }
        });

        const paymentsByClassroom = new Map<string, any[]>();
        paymentsData
          .filter((p: any) => p.payment_status === 'paid')
          .forEach((payment: any) => {
            if (payment.classroom_id) {
              if (!paymentsByClassroom.has(payment.classroom_id)) {
                paymentsByClassroom.set(payment.classroom_id, []);
              }
              paymentsByClassroom.get(payment.classroom_id)!.push(payment);
            }
          });

        // Calculate revenue synchronously (no async needed)
        const classroomsWithStats = classroomsData.map((classroom: Classroom) => {
            const studentsInClass = studentsByClassroom.get(classroom.id) || [];
            const studentCount = studentsInClass.length;
            
            // Get tuition info from classroom (now stored in classrooms table)
            const tuitionPerSession = typeof (classroom as any).tuition_per_session === 'number' 
              ? (classroom as any).tuition_per_session 
              : parseFloat(String((classroom as any).tuition_per_session || '50000')) || 50000;
            const sessionsPerWeek = typeof (classroom as any).sessions_per_week === 'number'
              ? (classroom as any).sessions_per_week
              : parseInt(String((classroom as any).sessions_per_week || '2'), 10) || 2;
            
            // Calculate total revenue: học phí = số học sinh × số buổi
            // tuition_per_session × sessions_per_week × student_count
            const totalRevenue = tuitionPerSession * sessionsPerWeek * studentCount;

            // Get payments for this classroom (already filtered and grouped)
            const classroomPayments = paymentsByClassroom.get(classroom.id) || [];

            let totalPaid = 0;
            let totalDiscount = 0;

            // Calculate from actual paid amounts - optimized loop
            for (const payment of classroomPayments) {
              const paidAmount = typeof payment.amount === 'number' 
                ? payment.amount 
                : parseFloat(String(payment.amount || '0'));
              const discountPercent = typeof payment.discount_percent === 'number'
                ? payment.discount_percent
                : parseFloat(String(payment.discount_percent || '0'));
              
              // Tính số tiền gốc từ số tiền đã trả và discount_percent
              const baseAmount = discountPercent > 0 && discountPercent < 100
                ? paidAmount / (1 - discountPercent / 100)
                : paidAmount;
              const discountAmount = baseAmount * (discountPercent / 100);
              
              totalPaid += paidAmount;
              totalDiscount += discountAmount;
            }

            return {
              ...classroom,
              student_count: studentCount,
              tuition_per_session: tuitionPerSession,
              sessions_per_week: sessionsPerWeek,
              total_revenue: totalRevenue,
              total_paid: totalPaid,
              total_discount: totalDiscount,
            };
          });

        setClassrooms(classroomsWithStats);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
    } finally {
      setLoadingClassrooms(false);
      setRefreshingClassrooms(false);
    }
  }, []);

  // Load students for a classroom with payment status
  const loadClassroomStudents = useCallback(async (classroomId: string) => {
    try {
      setLoadingStudents(true);
      const token = localStorage.getItem('auth_token');
      
      // Load students in this classroom
      const studentsResponse = await fetch(`${API_BASE_URL}/api/students?limit=1000&classroom_id=${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let studentsData: Student[] = [];
      if (studentsResponse.ok) {
        studentsData = await studentsResponse.json();
      }

      // Load payments for this classroom
      const paymentsResponse = await fetch(`${API_BASE_URL}/api/payments?limit=1000&classroom_id=${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let paymentsData: any[] = [];
      if (paymentsResponse.ok) {
        paymentsData = await paymentsResponse.json();
      }

      // Create a map of student payments for quick lookup
      const studentPaymentMap = new Map();
      paymentsData
        .filter((p: any) => p.payment_status === 'paid')
        .forEach((p: any) => {
          const studentId = p.student_id;
          if (!studentPaymentMap.has(studentId)) {
            studentPaymentMap.set(studentId, {
              amount: p.amount || 0,
              discount_percent: p.discount_percent || 0,
            });
          } else {
            // Nếu có nhiều payment, cộng dồn
            const existing = studentPaymentMap.get(studentId);
            studentPaymentMap.set(studentId, {
              amount: existing.amount + (p.amount || 0),
              discount_percent: Math.max(existing.discount_percent, p.discount_percent || 0), // Lấy % cao nhất
            });
          }
        });

      // Get paid student IDs
      const paidStudentIds = new Set(
        paymentsData
          .filter((p: any) => p.payment_status === 'paid')
          .map((p: any) => p.student_id)
      );

      // Load user names for students
      const studentsWithStatus = await Promise.all(
        studentsData.map(async (student: Student) => {
          try {
            const userResponse = await fetch(`${API_BASE_URL}/api/users/${student.user_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            let name = student.student_code;
            if (userResponse.ok) {
              const userData = await userResponse.json();
              name = userData.full_name || student.student_code;
            }

            const paymentInfo = studentPaymentMap.get(student.id);
            const isPaid = paidStudentIds.has(student.id);

            return {
              ...student,
              name,
              payment_status: (isPaid ? 'paid' : 'pending') as 'paid' | 'pending',
              payment_amount: paymentInfo?.amount || 0,
              discount_percent: paymentInfo?.discount_percent || 0,
            };
          } catch (error) {
            const paymentInfo = studentPaymentMap.get(student.id);
            const isPaid = paidStudentIds.has(student.id);
            
            return {
              ...student,
              name: student.student_code,
              payment_status: (isPaid ? 'paid' : 'pending') as 'paid' | 'pending',
              payment_amount: paymentInfo?.amount || 0,
              discount_percent: paymentInfo?.discount_percent || 0,
            };
          }
        })
      );

      setClassroomStudents(studentsWithStatus as Student[]);
    } catch (error) {
      console.error('Error loading classroom students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Check role from both user and localStorage
    let currentRole = user.role || '';
    const storedUser = localStorage.getItem('user');
    if (!currentRole && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        currentRole = parsed.role || '';
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // Normalize role to lowercase for comparison
    const normalizedRole = currentRole?.toLowerCase().trim();
    
    if (normalizedRole === 'admin') {
      loadExpenses();
      loadClassrooms();
      loadCategories();
    }
  }, [user, loadExpenses, loadClassrooms, loadCategories]);

  // Tự động set category mặc định khi categories load xong và đang tạo mới
  useEffect(() => {
    if (!editingExpense && categories.length > 0 && !expenseFormData.category) {
      setExpenseFormData(prev => ({
        ...prev,
        category: categories[0].code,
      }));
    }
  }, [categories, editingExpense]);

  // Expense handlers
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      
      // Làm tròn số tiền về bội số của 10000
      const amount = parseFloat(expenseFormData.amount) || 0;
      const roundedAmount = Math.round(amount / 10000) * 10000;
      
      const payload = {
        ...expenseFormData,
        amount: roundedAmount,
        date: new Date(expenseFormData.date).toISOString(),
        finance_type: 'expense', // Always expense
      };

      const url = editingExpense
        ? `${API_BASE_URL}/api/finances/${editingExpense.id}`
        : `${API_BASE_URL}/api/finances`;
      
      const response = await fetch(url, {
        method: editingExpense ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsExpenseDialogOpen(false);
        setEditingExpense(null);
        setExpenseFormData({
          title: '',
          description: '',
          amount: '',
          category: 'other',
          date: new Date().toISOString().split('T')[0],
          is_recurring: false,
        });
        loadExpenses();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Lỗi khi lưu chi phí');
    }
  };

  const handleExpenseDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chi phí này?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/finances/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        loadExpenses();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Lỗi khi xóa chi phí');
    }
  };

  // Load payment history for a student
  const loadPaymentHistory = useCallback(async (studentId: string) => {
    try {
      setLoadingPaymentHistory(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/payments?student_id=${studentId}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoadingPaymentHistory(false);
    }
  }, []);

  // Handle classroom click
  const handleClassroomClick = async (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setIsStudentDialogOpen(true);
    await loadClassroomStudents(classroom.id);
  };

  // Payment handlers
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !selectedClassroom) return;

    try {
      const token = localStorage.getItem('auth_token');
      
      // Làm tròn số tiền về bội số của 10000
      const amount = parseFloat(paymentFormData.amount) || 0;
      const roundedAmount = Math.round(amount / 10000) * 10000;

      // Tìm payment hiện tại của student trong classroom này (nếu có)
      const paymentsResponse = await fetch(
        `${API_BASE_URL}/api/payments?student_id=${editingStudent.id}&classroom_id=${selectedClassroom.id}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let existingPayment = null;
      if (paymentsResponse.ok) {
        const payments = await paymentsResponse.json();
        if (payments.length > 0) {
          existingPayment = payments[0];
        }
      }

      // Tính số tiền sau chiết khấu
      const baseAmount = roundedAmount;
      const discountPercent = parseFloat(paymentFormData.discount_percent) || 0;
      const finalAmount = baseAmount * (1 - discountPercent / 100);

      const payload = {
        student_id: editingStudent.id,
        classroom_id: selectedClassroom.id,
        amount: finalAmount,  // Số tiền cuối cùng sau chiết khấu
        payment_date: new Date(paymentFormData.payment_date).toISOString(),
        payment_method: paymentFormData.payment_method,
        payment_status: paymentFormData.payment_status,
        receipt_number: paymentFormData.receipt_number || null,
        notes: paymentFormData.notes || null,
        discount_percent: discountPercent,
      };

      let response;
      if (existingPayment) {
        // Update existing payment
        response = await fetch(`${API_BASE_URL}/api/payments/${existingPayment.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new payment
        response = await fetch(`${API_BASE_URL}/api/payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        setIsPaymentDialogOpen(false);
        setEditingStudent(null);
        // Reload both students and classrooms to update all data
        await Promise.all([
          loadClassroomStudents(selectedClassroom.id),
          loadClassrooms(true), // Auto-reload classrooms to update revenue stats (show refreshing indicator)
        ]);
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.detail || 'Không thể cập nhật thanh toán'}`);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Có lỗi xảy ra khi cập nhật thanh toán');
    }
  };

  // Category handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingCategory
        ? `${API_BASE_URL}/api/expense-categories/${editingCategory.id}`
        : `${API_BASE_URL}/api/expense-categories`;
      
      // Nếu không có code hoặc code trống, không gửi code (để backend tự động tạo)
      const payload: any = { ...categoryFormData };
      if (!editingCategory && (!payload.code || !payload.code.trim())) {
        delete payload.code;
      }
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsCategoryDialogOpen(false);
        setEditingCategory(null);
        setCategoryFormData({
          name: '',
          code: '',
          description: '',
          color: '#6B7280',
          is_active: true,
          sort_order: 0,
        });
        loadCategories();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Lỗi khi lưu danh mục');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Lỗi khi lưu danh mục');
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/expense-categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        loadCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Lỗi khi xóa danh mục');
    }
  };

  // Load next category code
  const loadNextCode = useCallback(async () => {
    try {
      setLoadingNextCode(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/expense-categories/next-code`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategoryFormData(prev => ({
          ...prev,
          code: data.next_code || '',
        }));
      }
    } catch (error) {
      console.error('Error loading next code:', error);
    } finally {
      setLoadingNextCode(false);
    }
  }, []);

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(expenseSearchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [expenseSearchQuery]);

  // Optimized filtered expenses with useMemo
  const filteredExpenses = useMemo(() => {
    return expenses.filter(f => {
      const matchesSearch = f.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, debouncedSearchQuery, filterCategory]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  // Check role from both user and localStorage
  let currentRole = user?.role || '';
  const storedUser = localStorage.getItem('user');
  if (!currentRole && storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      currentRole = parsed.role || '';
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
  }
  
  // Normalize role to lowercase for comparison
  const normalizedRole = currentRole?.toLowerCase().trim();
  
  if (!user || normalizedRole !== 'admin') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
      </div>
    );
  }

    return (
    <PageWithBackground>
      <div className="flex min-h-screen w-full">
        <AdminSidebar currentPage="finance" onNavigate={(page) => router.push(page.startsWith('/') ? page : `/${page}`)} onLogout={logout} />
        <div className={`flex-1 h-screen flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Tài chính</h1>
            <p className="text-gray-600 mt-2">Ghi lại chi phí và theo dõi doanh thu từ lớp học</p>
          </div>
          <Button onClick={() => router.push('/finance/overview')} variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Tổng quan Tài chính
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Chi phí
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Doanh thu
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="flex-1 flex flex-col space-y-4 overflow-auto pb-6">
            {/* Categories Management */}
            <Card className="card-transparent flex-shrink-0">
              <CardHeader className="card-transparent-header">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Quản lý Danh mục Chi phí
                  </CardTitle>
                  <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          setEditingCategory(null);
                          setCategoryFormData({
                            name: '',
                            code: '',
                            description: '',
                            color: '#6B7280',
                            is_active: true,
                            sort_order: 0,
                          });
                          // Load next code automatically
                          await loadNextCode();
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Thêm Danh mục
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Sửa' : 'Thêm'} Danh mục Chi phí</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div>
                          <Label>Tên danh mục *</Label>
                          <Input
                            value={categoryFormData.name}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                            required
                          />
        </div>
                        <div>
                          <Label>Mã danh mục</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              value={categoryFormData.code}
                              onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                              placeholder="DM001 (tự động tạo)"
                              disabled={loadingNextCode}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={loadNextCode}
                              disabled={loadingNextCode}
                            >
                              {loadingNextCode ? '...' : 'Tự động'}
                            </Button>
      </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {editingCategory 
                              ? 'Để trống để giữ nguyên mã hiện tại' 
                              : 'Để trống để tự động tạo mã theo mẫu DM001, DM002, ...'}
                          </p>
    </div>
                        <div>
                          <Label>Mô tả</Label>
                          <Textarea
                            value={categoryFormData.description}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Màu sắc</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={categoryFormData.color}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                                className="w-16 h-10"
                              />
                              <Input
                                value={categoryFormData.color}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Thứ tự sắp xếp</Label>
                            <Input
                              type="number"
                              value={categoryFormData.sort_order}
                              onChange={(e) => setCategoryFormData({ ...categoryFormData, sort_order: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="category_is_active"
                            checked={categoryFormData.is_active}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, is_active: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="category_is_active">Kích hoạt</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                            Hủy
                          </Button>
                          <Button type="submit">Lưu</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCategories ? (
                  <div className="text-center py-4">Đang tải...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.length === 0 ? (
                      <p className="text-center text-gray-500 col-span-full py-4">Chưa có danh mục nào</p>
                    ) : (
                      categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                          style={{ borderLeftColor: category.color || '#6B7280', borderLeftWidth: '4px' }}
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: category.color || '#6B7280' }}
                            ></div>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-xs text-gray-500">{category.code}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCategory(category);
                                setCategoryFormData({
                                  name: category.name,
                                  code: category.code,
                                  description: category.description || '',
                                  color: category.color || '#6B7280',
                                  is_active: category.is_active,
                                  sort_order: category.sort_order,
                                });
                                setIsCategoryDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCategoryDelete(category.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses List */}
            <Card className="card-transparent flex-1 flex flex-col min-h-0">
              <CardHeader className="card-transparent-header flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Chi phí</CardTitle>
                  <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingExpense(null);
                        // Set category mặc định từ danh mục đầu tiên hoặc để trống
                        const defaultCategory = categories.length > 0 ? categories[0].code : '';
                        setExpenseFormData({
                          title: '',
                          description: '',
                          amount: '',
                          category: defaultCategory,
                          date: new Date().toISOString().split('T')[0],
                          is_recurring: false,
                        });
                      }}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm Chi phí
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingExpense ? 'Sửa' : 'Thêm'} Chi phí</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleExpenseSubmit} className="space-y-4">
                        <div>
                          <Label>Tiêu đề *</Label>
                          <Input
                            value={expenseFormData.title}
                            onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Mô tả</Label>
                          <Textarea
                            value={expenseFormData.description}
                            onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Số tiền (VND) *</Label>
                            <Input
                              type="number"
                              step="10000"
                              min="0"
                              value={expenseFormData.amount}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Chỉ cho phép số và đảm bảo là bội số của 10000 khi blur
                                setExpenseFormData({ ...expenseFormData, amount: value });
                              }}
                              onBlur={(e) => {
                                // Làm tròn về bội số của 10000 khi blur
                                const value = parseFloat(e.target.value) || 0;
                                const rounded = Math.round(value / 10000) * 10000;
                                setExpenseFormData({ ...expenseFormData, amount: rounded.toString() });
                              }}
                              placeholder="Nhập số tiền (bội số của 10,000)"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Ví dụ: 100,000 VND, 500,000 VND, 1,000,000 VND
                            </p>
                          </div>
                          <div>
                            <Label>Danh mục *</Label>
                            <Select
                              value={expenseFormData.category}
                              onValueChange={(value) => setExpenseFormData({ ...expenseFormData, category: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={categories.length === 0 ? "Đang tải..." : "Chọn danh mục"} />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.length === 0 ? (
                                  <SelectItem value="" disabled>
                                    Đang tải danh mục...
                                  </SelectItem>
                                ) : (
                                  categories.map((category) => (
                                    <SelectItem key={category.id} value={category.code}>
                                      <div className="flex items-center space-x-2">
                                        {category.color && (
                                          <div
                                            className="w-3 h-3 rounded"
                                            style={{ backgroundColor: category.color }}
                                          ></div>
                                        )}
                                        <span>{category.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Ngày *</Label>
                          <Input
                            type="date"
                            value={expenseFormData.date}
                            onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_recurring"
                            checked={expenseFormData.is_recurring}
                            onChange={(e) => setExpenseFormData({ ...expenseFormData, is_recurring: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="is_recurring">Định kỳ</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                            Hủy
                          </Button>
                          <Button type="submit">Lưu</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Tìm kiếm..."
                      value={expenseSearchQuery}
                      onChange={(e) => setExpenseSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.code}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {loadingExpenses ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Định kỳ</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            Chưa có chi phí nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExpenses.map((expense) => {
                          const category = categories.find(c => c.code === expense.category);
                          return (
                            <TableRow key={expense.id}>
                              <TableCell>{expense.title}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {category?.color && (
                                    <div
                                      className="w-3 h-3 rounded"
                                      style={{ backgroundColor: category.color }}
                                    ></div>
                                  )}
                                  <span>{category?.name || expense.category}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-red-600 font-medium">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount)}
                            </TableCell>
                            <TableCell>{new Date(expense.date).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{expense.is_recurring ? 'Có' : 'Không'}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                  setEditingExpense(expense);
                                  // Đảm bảo category code tồn tại trong danh sách categories
                                  const categoryCode = categories.find(c => c.code === expense.category) 
                                    ? expense.category 
                                    : (categories.length > 0 ? categories[0].code : '');
                                  setExpenseFormData({
                                    title: expense.title,
                                    description: expense.description || '',
                                    amount: expense.amount.toString(),
                                    category: categoryCode,
                                    date: new Date(expense.date).toISOString().split('T')[0],
                                    is_recurring: expense.is_recurring,
                                  });
                                  setIsExpenseDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExpenseDelete(expense.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="flex-1 flex flex-col space-y-4 overflow-auto pb-6">
            <Card className="card-transparent flex-1 flex flex-col min-h-0">
              <CardHeader className="card-transparent-header flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Doanh thu từ Lớp học
                  {refreshingClassrooms && (
                    <span className="ml-2 text-sm text-blue-600 flex items-center gap-1">
                      <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      Đang cập nhật...
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Doanh thu dự kiến = Học phí/buổi × Số buổi/tuần × Số học sinh
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {loadingClassrooms ? (
      <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Tên lớp</TableHead>
                          <TableHead className="font-semibold">Mã lớp</TableHead>
                          <TableHead className="font-semibold text-center">Số học sinh</TableHead>
                          <TableHead className="font-semibold text-right">Học phí/buổi</TableHead>
                          <TableHead className="font-semibold text-center">Số buổi/tuần</TableHead>
                          <TableHead className="font-semibold text-right">Doanh thu dự kiến</TableHead>
                          <TableHead className="font-semibold text-right">Số tiền đã thu</TableHead>
                          <TableHead className="font-semibold text-right">Chiết khấu</TableHead>
                          <TableHead className="font-semibold text-center">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classrooms.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                              <div className="flex flex-col items-center">
                                <School className="h-12 w-12 text-gray-300 mb-2" />
                                <p className="text-lg">Chưa có lớp học nào</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          classrooms.map((classroom: any, index: number) => (
                            <TableRow 
                              key={classroom.id}
                              className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                            >
                              <TableCell className="font-medium">{classroom.name}</TableCell>
                              <TableCell className="font-mono text-sm">{classroom.code}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="px-2 py-1">
                                  <Users className="h-3 w-3 mr-1 inline" />
                                  {classroom.student_count || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(classroom.tuition_per_session || 0)}
                              </TableCell>
                              <TableCell className="text-center">{classroom.sessions_per_week || 0}</TableCell>
                              <TableCell className="text-right">
                                <span className="font-semibold text-blue-600">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(classroom.total_revenue || 0)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-semibold text-green-600">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(classroom.total_paid || 0)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {classroom.total_discount && classroom.total_discount > 0 ? (
                                  <span className="font-semibold text-red-600">
                                    - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(classroom.total_discount)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleClassroomClick(classroom)}
                                  className="hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Xem học sinh
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Student List Dialog */}
        <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Danh sách học sinh - {selectedClassroom?.name} ({selectedClassroom?.code})
              </DialogTitle>
            </DialogHeader>
            {loadingStudents ? (
              <div className="text-center py-8">Đang tải danh sách học sinh...</div>
            ) : (
              <div className="space-y-4">
                {/* Statistics Cards */}
                {(() => {
                  const paidStudents = classroomStudents.filter(s => s.payment_status === 'paid');
                  const pendingStudents = classroomStudents.filter(s => s.payment_status === 'pending');
                  const tuitionPerSession = selectedClassroom?.tuition_per_session || 0;
                  const sessionsPerWeek = selectedClassroom?.sessions_per_week || 0;
                  const monthlyTuition = tuitionPerSession * sessionsPerWeek;
                  
                  // Tính số tiền đã thu từ payment_amount thực tế
                  const totalPaidAmount = paidStudents.reduce((sum, s) => sum + (s.payment_amount || 0), 0);
                  // Tính số tiền chưa đóng (dự kiến)
                  const totalPendingAmount = pendingStudents.length * monthlyTuition;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="card-transparent border-2 border-blue-200">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-600 mb-1">Tổng số học sinh</div>
                              <div className="text-3xl font-bold text-blue-700">{classroomStudents.length}</div>
                            </div>
                            <Users className="h-10 w-10 text-blue-400" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="card-transparent border-2 border-green-200">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-600 mb-1">Đã đóng</div>
                              <div className="text-3xl font-bold text-green-700">{paidStudents.length}</div>
                              <div className="text-sm font-semibold text-green-600 mt-2">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaidAmount)}
                              </div>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-400" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="card-transparent border-2 border-red-200">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-600 mb-1">Chưa đóng</div>
                              <div className="text-3xl font-bold text-red-700">{pendingStudents.length}</div>
                              <div className="text-sm font-semibold text-red-600 mt-2">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPendingAmount)}
                              </div>
                            </div>
                            <XCircle className="h-10 w-10 text-red-400" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="card-transparent border-2 border-purple-200">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-600 mb-1">Tỷ lệ đóng</div>
                              <div className="text-3xl font-bold text-purple-700">
                                {classroomStudents.length > 0 
                                  ? Math.round((paidStudents.length / classroomStudents.length) * 100) 
                                  : 0}%
                              </div>
                            </div>
                            <DollarSign className="h-10 w-10 text-purple-400" />
                          </div>
                        </CardContent>
                      </Card>
      </div>
    );
                })()}

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Mã học sinh</TableHead>
                        <TableHead className="font-semibold">Tên học sinh</TableHead>
                        <TableHead className="font-semibold text-center">Trạng thái</TableHead>
                        <TableHead className="font-semibold text-right">Số tiền học phí</TableHead>
                        <TableHead className="font-semibold text-right">Số tiền đã đóng</TableHead>
                        <TableHead className="font-semibold text-center">Chiết khấu</TableHead>
                        <TableHead className="font-semibold text-center">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classroomStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center">
                              <Users className="h-12 w-12 text-gray-300 mb-2" />
                              <p className="text-lg">Lớp học này chưa có học sinh</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        classroomStudents.map((student, index) => (
                          <TableRow 
                            key={student.id}
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <TableCell className="font-mono text-sm">{student.student_code}</TableCell>
                            <TableCell className="font-medium">{student.name || student.student_code}</TableCell>
                            <TableCell className="text-center">
                              {student.payment_status === 'paid' ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
                                  <CheckCircle className="h-3 w-3 mr-1.5" />
                                  Đã đóng
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="px-3 py-1">
                                  <XCircle className="h-3 w-3 mr-1.5" />
                                  Chưa đóng
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {(() => {
                                const tuitionPerSession = selectedClassroom?.tuition_per_session || 0;
                                const sessionsPerWeek = selectedClassroom?.sessions_per_week || 0;
                                const studentTuition = tuitionPerSession * sessionsPerWeek;
                                return (
                                  <span className="text-blue-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(studentTuition)}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {student.payment_status === 'paid' && student.payment_amount ? (
                                <span className="text-green-600">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(student.payment_amount)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {student.payment_status === 'paid' && student.discount_percent && student.discount_percent > 0 ? (
                                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 px-3 py-1">
                                  <span className="font-semibold">-{student.discount_percent.toFixed(1)}%</span>
                                </Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center space-x-2">
                                {student.payment_status !== 'paid' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                    if (!selectedClassroom) return;
                                    if (!confirm(`Đánh dấu học sinh ${student.name || student.student_code} đã đóng tiền?`)) return;

                                    try {
                                      const token = localStorage.getItem('auth_token');
                                      
                                      // Tính học phí
                                      const tuitionPerSession = selectedClassroom?.tuition_per_session || 0;
                                      const sessionsPerWeek = selectedClassroom?.sessions_per_week || 0;
                                      const monthlyTuition = tuitionPerSession * sessionsPerWeek;
                                      const roundedAmount = Math.round(monthlyTuition / 10000) * 10000;

                                      // Tìm payment hiện tại
                                      const paymentsResponse = await fetch(
                                        `${API_BASE_URL}/api/payments?student_id=${student.id}&classroom_id=${selectedClassroom.id}&limit=1`,
                                        {
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                          },
                                        }
                                      );

                                      let existingPayment = null;
                                      if (paymentsResponse.ok) {
                                        const payments = await paymentsResponse.json();
                                        if (payments.length > 0) {
                                          existingPayment = payments[0];
                                        }
                                      }

                                      const payload = {
                                        student_id: student.id,
                                        classroom_id: selectedClassroom.id,
                                        amount: roundedAmount,
                                        payment_date: new Date().toISOString(),
                                        payment_method: 'cash',
                                        payment_status: 'paid',
                                        receipt_number: null,
                                        notes: null,
                                        discount_percent: 0,  // Không có chiết khấu khi dùng nút "Đã đóng" nhanh
                                      };

                                      let response;
                                      if (existingPayment) {
                                        // Update existing payment
                                        response = await fetch(`${API_BASE_URL}/api/payments/${existingPayment.id}`, {
                                          method: 'PUT',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify(payload),
                                        });
                                      } else {
                                        // Create new payment
                                        response = await fetch(`${API_BASE_URL}/api/payments`, {
                                          method: 'POST',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify(payload),
                                        });
                                      }

                                      if (response.ok) {
                                        // Reload both students and classrooms to update all data
                                        await Promise.all([
                                          loadClassroomStudents(selectedClassroom.id),
                                          loadClassrooms(true), // Auto-reload classrooms to update revenue stats (show refreshing indicator)
                                        ]);
                                      } else {
                                        const errorData = await response.json();
                                        alert(`Lỗi: ${errorData.detail || 'Không thể cập nhật thanh toán'}`);
                                      }
                                    } catch (error) {
                                      console.error('Error marking payment as paid:', error);
                                      alert('Có lỗi xảy ra khi đánh dấu đã đóng');
                                    }
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Đã đóng
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  setSelectedStudentForHistory(student);
                                  setIsPaymentHistoryDialogOpen(true);
                                  await loadPaymentHistory(student.id);
                                }}
                                className="mr-1"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Lịch sử
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  setEditingStudent(student);
                                  const token = localStorage.getItem('auth_token');
                                  
                                  // Load existing payment if any
                                  try {
                                    const paymentsResponse = await fetch(
                                      `${API_BASE_URL}/api/payments?student_id=${student.id}&classroom_id=${selectedClassroom?.id}&limit=1`,
                                      {
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'Content-Type': 'application/json',
                                        },
                                      }
                                    );

                                    if (paymentsResponse.ok) {
                                      const payments = await paymentsResponse.json();
                                      if (payments.length > 0) {
                                        const payment = payments[0];
                                        // Tính lại số tiền gốc từ số tiền đã trừ chiết khấu và discount_percent
                                        const discountPercent = payment.discount_percent || 0;
                                        const paidAmount = payment.amount || 0;
                                        const baseAmount = discountPercent > 0 ? paidAmount / (1 - discountPercent / 100) : paidAmount;
                                        
                                        setPaymentFormData({
                                          amount: baseAmount.toString(),
                                          payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                          payment_method: payment.payment_method || 'cash',
                                          payment_status: payment.payment_status || 'paid',
                                          receipt_number: payment.receipt_number || '',
                                          notes: payment.notes || '',
                                          discount_percent: discountPercent.toString(),
                                        });
                                      } else {
                                        // No existing payment, use defaults
                                        const tuitionPerSession = selectedClassroom?.tuition_per_session || 0;
                                        const sessionsPerWeek = selectedClassroom?.sessions_per_week || 0;
                                        const monthlyTuition = tuitionPerSession * sessionsPerWeek;
                                        
                                        setPaymentFormData({
                                          amount: monthlyTuition.toString(),
                                          payment_date: new Date().toISOString().split('T')[0],
                                          payment_method: 'cash',
                                          payment_status: student.payment_status === 'paid' ? 'paid' : 'pending',
                                          receipt_number: '',
                                          notes: '',
                                          discount_percent: '0',
                                        });
                                      }
                                    } else {
                                      // Fallback to defaults
                                      const tuitionPerSession = selectedClassroom?.tuition_per_session || 0;
                                      const sessionsPerWeek = selectedClassroom?.sessions_per_week || 0;
                                      const monthlyTuition = tuitionPerSession * sessionsPerWeek;
                                      
                                      setPaymentFormData({
                                        amount: monthlyTuition.toString(),
                                        payment_date: new Date().toISOString().split('T')[0],
                                        payment_method: 'cash',
                                        payment_status: student.payment_status === 'paid' ? 'paid' : 'pending',
                                        receipt_number: '',
                                        notes: '',
                                        discount_percent: '0',
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Error loading payment:', error);
                                    // Use defaults on error
                                    const tuitionPerSession = selectedClassroom?.tuition_per_session || 0;
                                    const sessionsPerWeek = selectedClassroom?.sessions_per_week || 0;
                                    const monthlyTuition = tuitionPerSession * sessionsPerWeek;
                                    
                                    setPaymentFormData({
                                      amount: monthlyTuition.toString(),
                                      payment_date: new Date().toISOString().split('T')[0],
                                      payment_method: 'cash',
                                      payment_status: student.payment_status === 'paid' ? 'paid' : 'pending',
                                      receipt_number: '',
                                      notes: '',
                                      discount_percent: '0',
                                    });
                                  }
                                  
                                  setIsPaymentDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Sửa
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsStudentDialogOpen(false)}>
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Edit Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? `Cập nhật thanh toán - ${editingStudent.name || editingStudent.student_code}` : 'Thêm thanh toán'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số tiền gốc (VND) *</Label>
                  <Input
                    type="number"
                    step="10000"
                    min="0"
                    value={paymentFormData.amount}
                    onChange={(e) => {
                      const baseAmount = e.target.value;
                      const discountPercent = parseFloat(paymentFormData.discount_percent) || 0;
                      const finalAmount = parseFloat(baseAmount) * (1 - discountPercent / 100);
                      setPaymentFormData({ 
                        ...paymentFormData, 
                        amount: baseAmount,
                      });
                    }}
                    required
                  />
                </div>
                <div>
                  <Label>Chiết khấu (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={paymentFormData.discount_percent}
                    onChange={(e) => {
                      const discountPercent = parseFloat(e.target.value) || 0;
                      const baseAmount = parseFloat(paymentFormData.amount) || 0;
                      setPaymentFormData({ 
                        ...paymentFormData, 
                        discount_percent: e.target.value,
                      });
                    }}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ví dụ: 10 cho 10% chiết khấu
                  </p>
                </div>
              </div>
              {(() => {
                const baseAmount = parseFloat(paymentFormData.amount) || 0;
                const discountPercent = parseFloat(paymentFormData.discount_percent) || 0;
                const discountAmount = baseAmount * (discountPercent / 100);
                const finalAmount = baseAmount - discountAmount;

  return (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Số tiền gốc:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseAmount)}
                      </span>
                    </div>
                    {discountPercent > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Chiết khấu ({discountPercent}%):</span>
                          <span className="font-medium">
                            - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">Số tiền phải thanh toán:</span>
                            <span className="font-bold text-green-600 text-lg">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalAmount)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngày thanh toán *</Label>
                  <Input
                    type="date"
                    value={paymentFormData.payment_date}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                    required
                  />
        </div>
                <div>
                  <Label>Phương thức thanh toán</Label>
                  <Select
                    value={paymentFormData.payment_method}
                    onValueChange={(value) => setPaymentFormData({ ...paymentFormData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tiền mặt</SelectItem>
                      <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Trạng thái *</Label>
                <Select
                  value={paymentFormData.payment_status}
                  onValueChange={(value) => setPaymentFormData({ ...paymentFormData, payment_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Đã đóng</SelectItem>
                    <SelectItem value="pending">Chưa đóng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số biên lai</Label>
                <Input
                  value={paymentFormData.receipt_number}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, receipt_number: e.target.value })}
                  placeholder="Nhập số biên lai (nếu có)"
                />
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Lưu</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={isPaymentHistoryDialogOpen} onOpenChange={setIsPaymentHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Lịch sử thanh toán - {selectedStudentForHistory?.name || selectedStudentForHistory?.student_code}
              </DialogTitle>
            </DialogHeader>
            {loadingPaymentHistory ? (
              <div className="text-center py-8">Đang tải lịch sử thanh toán...</div>
            ) : (
              <div className="space-y-4">
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Chưa có lịch sử thanh toán</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Ngày thanh toán</TableHead>
                          <TableHead className="font-semibold text-right">Số tiền</TableHead>
                          <TableHead className="font-semibold text-center">Phương thức</TableHead>
                          <TableHead className="font-semibold text-center">Trạng thái</TableHead>
                          <TableHead className="font-semibold text-center">Chiết khấu</TableHead>
                          <TableHead className="font-semibold">Số biên lai</TableHead>
                          <TableHead className="font-semibold">Ghi chú</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.map((payment: any, index: number) => (
                          <TableRow 
                            key={payment.id}
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <TableCell>
                              {new Date(payment.payment_date).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              <span className="text-green-600">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount || 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {payment.payment_method === 'cash' ? 'Tiền mặt' :
                               payment.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                               payment.payment_method === 'card' ? 'Thẻ' : 'Khác'}
                            </TableCell>
                            <TableCell className="text-center">
                              {payment.payment_status === 'paid' ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
                                  <CheckCircle className="h-3 w-3 mr-1.5" />
                                  Đã đóng
                                </Badge>
                              ) : payment.payment_status === 'pending' ? (
                                <Badge variant="outline" className="px-3 py-1">
                                  <Clock className="h-3 w-3 mr-1.5" />
                                  Chờ đóng
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="px-3 py-1">
                                  <XCircle className="h-3 w-3 mr-1.5" />
                                  {payment.payment_status}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {payment.discount_percent && payment.discount_percent > 0 ? (
                                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 px-3 py-1">
                                  <span className="font-semibold">-{parseFloat(payment.discount_percent).toFixed(1)}%</span>
                                </Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.receipt_number || <span className="text-gray-400">—</span>}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {payment.notes || <span className="text-gray-400">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Tổng số giao dịch: <span className="font-semibold">{paymentHistory.length}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Tổng số tiền: <span className="font-semibold text-green-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        paymentHistory.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsPaymentHistoryDialogOpen(false)}>
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </PageWithBackground>
  );
}
