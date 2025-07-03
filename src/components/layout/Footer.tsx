import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 border-t border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="flex justify-center items-center">
          <p className="text-sm text-muted-foreground text-center">
            © 2025 AngelFlight Marketing Services. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;