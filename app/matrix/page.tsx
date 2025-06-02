"use client";

import MatrixTable from '../../components/matrix/MatrixTable';

export default function MatrixPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Matrix View</h1>
      <MatrixTable />
    </div>
  );
}
