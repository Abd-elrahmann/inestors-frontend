import React from "react";
import { Card, Typography } from "antd";
import {
  UsergroupAddOutlined,
  UserOutlined,
  TransactionOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

// eslint-disable-next-line no-unused-vars
const ReportCard = ({ type, title, icon, isActive, onClick }) => {
  const cardStyle = (active) => ({
    textAlign: "center",
    cursor: "pointer",
    borderRadius: 12,
    boxShadow: active ? "0 0 10px #28a745" : "0 2px 8px rgba(0,0,0,0.1)",
    border: active ? "2px solid #28a745" : "1px solid #f0f0f0",
    transition: "all 0.3s ease",
    padding: 16,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  });

  const iconStyle = { fontSize: 30, color: "#28a745", marginBottom: 16 };

  const getIcon = (iconType) => {
    switch (iconType) {
      case "investors":
        return <UsergroupAddOutlined style={iconStyle} />;
      case "individual":
        return <UserOutlined style={iconStyle} />;
      case "transactions":
        return <TransactionOutlined style={iconStyle} />;
      case "financial-year":
        return <CalendarOutlined style={iconStyle} />;
      default:
        return null;
    }
  };

  return (
    <Card
      hoverable
      style={cardStyle(isActive)}
      onClick={onClick}
      variant="outlined"
    >
      {getIcon(type)}
      <Title level={5}>{title}</Title>
    </Card>
  );
};

export default ReportCard;