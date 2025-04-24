import Sidebar from "../components/Sidebar";

interface Props {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: Props) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
