
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Edit, User } from 'lucide-react';
import { ClientData } from '@/components/clients/ClientCard';

// Sample clients data
const sampleClients: ClientData[] = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria.silva@example.com',
    phone: '912345678',
    sessionCount: 12,
    nextSession: '28 Apr, 10:00',
    totalPaid: 1440
  },
  {
    id: '2',
    name: 'João Santos',
    email: 'joao.santos@example.com',
    phone: '923456789',
    sessionCount: 5,
    nextSession: '28 Apr, 14:00',
    totalPaid: 600
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'ana.costa@example.com',
    phone: '934567890',
    sessionCount: 8,
    nextSession: '29 Apr, 11:00',
    totalPaid: 960
  }
];

// Sample sessions data
const sampleSessions = [
  { id: '1', clientId: '1', date: '14 Apr, 2023', notes: 'Great progress in focus exercises', paid: true },
  { id: '2', clientId: '1', date: '07 Apr, 2023', notes: 'Some difficulty with sustained attention, adjusted protocol', paid: true },
  { id: '3', clientId: '1', date: '31 Mar, 2023', notes: 'Baseline assessment', paid: true },
  { id: '4', clientId: '2', date: '10 Apr, 2023', notes: 'First session, establishing baseline', paid: true },
  { id: '5', clientId: '3', date: '12 Apr, 2023', notes: 'Follow-up assessment', paid: true },
];

// Sample payment data
const samplePayments = [
  { id: '1', clientId: '1', date: '14 Apr, 2023', amount: 120, description: 'Neurofeedback session', method: 'Credit Card' },
  { id: '2', clientId: '1', date: '07 Apr, 2023', amount: 120, description: 'Neurofeedback session', method: 'Credit Card' },
  { id: '3', clientId: '1', date: '31 Mar, 2023', amount: 200, description: 'Initial assessment', method: 'Bank Transfer' },
  { id: '4', clientId: '2', date: '10 Apr, 2023', amount: 120, description: 'Neurofeedback session', method: 'Cash' },
  { id: '5', clientId: '3', date: '12 Apr, 2023', amount: 120, description: 'Neurofeedback session', method: 'Credit Card' },
];

const ClientDetailPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  
  // Find the client with the matching ID
  const client = sampleClients.find(c => c.id === clientId);
  
  // Filter sessions and payments for this client
  const clientSessions = sampleSessions.filter(session => session.clientId === clientId);
  const clientPayments = samplePayments.filter(payment => payment.clientId === clientId);
  
  // If client not found, show an error
  if (!client) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500">Client Not Found</h2>
          <p className="mt-2 mb-6">The client you're looking for doesn't exist or has been removed.</p>
          <Link to="/clients">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="flex items-center mb-8">
        <Link to="/clients">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold gradient-heading">{client.name}</h1>
          <p className="text-neuro-gray mt-1">{client.email} • {client.phone}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="glassmorphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-neuro-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{client.sessionCount}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neuro-primary">
              <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />
              <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />
              <path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" />
              <path d="M22 9c-4.29 0-7.14-2.33-10-7 4.67 2.33 5.56 5 3 7" />
            </svg>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{client.totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Session</CardTitle>
            <Calendar className="h-4 w-4 text-neuro-primary" />
          </CardHeader>
          <CardContent>
            {client.nextSession ? (
              <p className="text-xl font-medium">{client.nextSession}</p>
            ) : (
              <p className="text-neuro-gray">No upcoming sessions</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-0">
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-neuro-gray mb-1">Full Name</h3>
                  <p>{client.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neuro-gray mb-1">Email Address</h3>
                  <p>{client.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neuro-gray mb-1">Phone Number</h3>
                  <p>{client.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neuro-gray mb-1">Address</h3>
                  <p>Rua das Flores 123, Lisboa</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neuro-gray mb-1">Notes</h3>
                <p className="text-sm">
                  Client reports difficulty with focus and attention. Has previously tried medication with limited success.
                  Seeking neurofeedback as an alternative treatment approach.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sessions" className="mt-0">
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Session History</span>
              </CardTitle>
              <Button className="bg-neuro-primary hover:bg-neuro-secondary">Add Session</Button>
            </CardHeader>
            <CardContent>
              {clientSessions.length > 0 ? (
                <div className="space-y-4">
                  {clientSessions.map((session) => (
                    <div key={session.id} className="p-4 rounded-lg bg-neuro-soft-purple border border-white/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">Session on {session.date}</h3>
                            <Badge variant="outline" className="text-xs">
                              {session.paid ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </div>
                          <p className="text-sm mt-2 text-neuro-gray">{session.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-neuro-gray">No session history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-0">
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Payment History</span>
              </CardTitle>
              <Button className="bg-neuro-primary hover:bg-neuro-secondary">Record Payment</Button>
            </CardHeader>
            <CardContent>
              {clientPayments.length > 0 ? (
                <div className="space-y-4">
                  {clientPayments.map((payment) => (
                    <div key={payment.id} className="p-4 rounded-lg bg-neuro-soft-blue border border-white/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{payment.description}</h3>
                          <p className="text-sm text-neuro-gray">Date: {payment.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">€{payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-neuro-gray">{payment.method}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-neuro-gray">No payment history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default ClientDetailPage;
