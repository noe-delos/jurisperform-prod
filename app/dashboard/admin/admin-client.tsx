"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AdminSearchProps {
  defaultValue?: string;
}

export function AdminSearch({ defaultValue = "" }: AdminSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(defaultValue);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page"); // Reset to first page when searching

    startTransition(() => {
      router.push(`/dashboard/admin?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchValue);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, prénom ou email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 shadow-soft"
          disabled={isPending}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="bg-foreground/5 hover:bg-foreground/10 border-foreground/20 text-foreground rounded-xl cursor-pointer"
      >
        Rechercher
      </Button>
    </form>
  );
}

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: AdminPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`/dashboard/admin?${params.toString()}`);
    });
  };

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Affichage de {(currentPage - 1) * pageSize + 1} à{" "}
        {Math.min(currentPage * pageSize, totalCount)} sur {totalCount}{" "}
        utilisateurs
      </div>
      <div className="flex items-center space-x-2">
        {currentPage > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={isPending}
            className="bg-foreground/5 hover:bg-foreground/10 border-foreground/20 text-foreground rounded-xl cursor-pointer"
          >
            Précédent
          </Button>
        )}

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => navigateToPage(page)}
                disabled={isPending}
                className={`rounded-xl cursor-pointer ${
                  currentPage === page
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-foreground/5 hover:bg-foreground/10 border-foreground/20 text-foreground"
                }`}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {currentPage < totalPages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={isPending}
            className="bg-foreground/5 hover:bg-foreground/10 border-foreground/20 text-foreground rounded-xl cursor-pointer"
          >
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}
