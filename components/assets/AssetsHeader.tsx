import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Plus, Loader2, ChevronDown } from 'lucide-react';

interface AssetsHeaderProps {
  onSearch: (term: string) => void;
  onCategoryFilter: (category?: string) => void;
  onCreateNew: () => void;
  isCreating?: boolean;
}

export function AssetsHeader({ 
  onSearch, 
  onCategoryFilter, 
  onCreateNew,
  isCreating 
}: AssetsHeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');

  const categories = [
    { value: undefined, label: 'All Categories' },
    { value: 'AI_COMPUTE', label: 'AI/Compute' },
    { value: 'ROBOTICS_PHYSICAL_AI', label: 'Robotics/Physical AI' },
    { value: 'QUANTUM_COMPUTING', label: 'Quantum Computing' },
    { value: 'BIOTECH_HEALTH', label: 'Biotech/Health' },
    { value: 'FINTECH_CRYPTO', label: 'Fintech/Crypto' },
    { value: 'ENERGY_CLEANTECH', label: 'Energy/Cleantech' },
    { value: 'SPACE_DEFENSE', label: 'Space/Defense' },
    { value: 'TRADITIONAL_TECH', label: 'Traditional Tech' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleCategoryChange = (category: string | undefined, label: string) => {
    setSelectedCategory(label);
    onCategoryFilter(category);
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex space-x-4">
        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-64"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-48 justify-between">
              {selectedCategory}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.label}
                onClick={() => handleCategoryChange(category.value, category.label)}
              >
                {category.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Button 
        onClick={onCreateNew}
        disabled={isCreating}
        className="flex items-center space-x-2"
      >
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        <span>Create Asset</span>
      </Button>
    </div>
  );
} 