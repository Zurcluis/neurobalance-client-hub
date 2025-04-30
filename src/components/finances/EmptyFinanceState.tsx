
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

const EmptyFinanceState = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
      <img 
        src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
        alt="NeuroBalance Logo" 
        className="h-20 w-auto mb-6 mx-auto"
      />
      <h2 className="text-2xl font-bold text-[#265255] mb-4">Sem dados financeiros</h2>
      <p className="text-gray-600 max-w-md mx-auto mb-8">
        Adicione clientes e registe pagamentos para visualizar o seu relatório financeiro.
      </p>
      <Button 
        asChild
        className="bg-[#3f9094] hover:bg-[#265255]"
      >
        <Link to="/clients">
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Cliente
        </Link>
      </Button>
    </div>
  );
};

export default EmptyFinanceState;
