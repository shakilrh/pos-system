import { FC } from 'react';

export const Footer: FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-inner py-4">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
        <p>© {new Date().getFullYear()} MyApp. All rights reserved.</p>
      </div>
    </footer>
  );
};
