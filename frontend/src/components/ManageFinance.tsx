import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Search, Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Finance } from '../types';

export function ManageFinance() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredFinances = finances.filter(finance =>
    finance.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    finance.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalIncome = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const balance = totalIncome - totalExpense;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
            <h1 className="text-3xl mb-2 text-black">Quản lý Tài chính</h1>
            <p className="text-black">Theo dõi thu chi và báo cáo tài chính</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng thu</p>
                <p className="text-2xl text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng chi</p>
                <p className="text-2xl text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Số dư</p>
                <p className={`text-2xl ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ thu chi</CardTitle>
            <CardDescription>So sánh thu và chi trong tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Thu nhập</span>
                  <span className="text-green-600">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(totalIncome / (totalIncome + totalExpense)) * 100}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Chi phí</span>
                  <span className="text-red-600">{formatCurrency(totalExpense)}</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${(totalExpense / (totalIncome + totalExpense)) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân loại chi phí</CardTitle>
            <CardDescription>Chi phí theo danh mục</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {finances.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chưa có dữ liệu chi phí</p>
                </div>
              ) : (
                // Dynamic category breakdown based on actual data
                Object.entries(
                  finances
                    .filter(f => f.type === 'expense')
                    .reduce((acc, finance) => {
                      acc[finance.category] = (acc[finance.category] || 0) + finance.amount;
                      return acc;
                    }, {} as Record<string, number>)
                ).map(([category, amount], index) => {
                  const total = Object.values(
                    finances
                      .filter(f => f.type === 'expense')
                      .reduce((acc, finance) => {
                        acc[finance.category] = (acc[finance.category] || 0) + finance.amount;
                        return acc;
                      }, {} as Record<string, number>)
                  ).reduce((sum, val) => sum + val, 0);
                  
                  const percentage = total > 0 ? (amount / total) * 100 : 0;
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-green-500', 'bg-red-500'];
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{category}</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[index % colors.length]}`} 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lịch sử giao dịch</CardTitle>
              <CardDescription>Tổng số {filteredFinances.length} giao dịch</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm giao dịch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm giao dịch
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm giao dịch mới</DialogTitle>
                    <DialogDescription>
                      Điền thông tin giao dịch vào form bên dưới
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Mô tả</Label>
                      <Input id="description" placeholder="Học phí tháng 10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Số tiền</Label>
                      <Input id="amount" type="number" placeholder="1000000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Danh mục</Label>
                      <Input id="category" placeholder="Học phí" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Ngày giao dịch</Label>
                      <Input id="date" type="date" />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1" onClick={() => setIsDialogOpen(false)}>
                        Thêm mới
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFinances.map((finance) => (
                  <TableRow key={finance.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          finance.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {finance.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <span>{finance.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{finance.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{finance.date}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={finance.type === 'income' 
                        ? 'bg-green-100 text-green-600 hover:bg-green-100' 
                        : 'bg-red-100 text-red-600 hover:bg-red-100'
                      }>
                        {finance.type === 'income' ? 'Thu' : 'Chi'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={finance.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
