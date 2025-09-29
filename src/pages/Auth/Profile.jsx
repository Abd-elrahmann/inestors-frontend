import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Avatar,
  Divider,
  Row,
  Col,
  Space,
  Spin,
  Layout,
  Tag,
  Grid,
  Upload,
  Modal,
  Dropdown,
  Menu,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  MailOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  DeleteOutlined,
  LockOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import Api from "../../services/api";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import { useUser } from "../../utils/user";
const { Title, Text } = Typography;
const { Content } = Layout;
const { useBreakpoint } = Grid;

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user: profile, updateProfile } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
  });
  // eslint-disable-next-line no-unused-vars
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    setIsPageLoading(true);

    try {
      const response = await Api.get("/api/profile");

      if (response.data) {
        const userData = {
          fullName: response.data.fullName,
          userName: response.data.userName,
          email: response.data.email,
          role: response.data.role,
          profileImage: response.data.profileImage,
        };

        updateProfile(userData);
        setFormData({
          fullName: userData.fullName || "",
          userName: userData.userName || "",
        });
        form.setFieldsValue({
          fullName: userData.fullName || "",
          userName: userData.userName || "",
        });
        localStorage.setItem("profile", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error loading user data:", error);

      if (error.response?.status === 401) {
        toast.error("حدث خطأ في تحميل البيانات");
      }
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleSave = async (values) => {
    setIsLoading(true);

    try {
      const response = await Api.put("/api/profile/update-name", {
        fullName: values.fullName.trim(),
      });

      if (response) {
        const updatedUser = { ...profile, fullName: values.fullName };
        updateProfile(updatedUser);
        localStorage.setItem("profile", JSON.stringify(updatedUser));
        toast.success("تم تحديث الاسم بنجاح!");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (values) => {
    try {
      await Api.put("/api/profile/update-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      toast.success("تم تحديث كلمة المرور بنجاح");
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      console.log(error);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
  
      reader.onload = async () => {
        const response = await Api.put("/api/profile/upload-image", {
          image: reader.result,
        });
  
        if (response) {
          updateProfile({ 
            ...profile, 
            profileImage: response.data.user.profileImage 
          });
          
          localStorage.setItem(
            "profile",
            JSON.stringify({
              ...profile,
              profileImage: response.data.user.profileImage,
            })
          );
          
          toast.success("تم رفع الصورة بنجاح");
        }
      };
    } catch (error) {
      console.log(error);
      toast.error("فشل تحميل الصورة");
    }
  };

  const handleImageDelete = async () => {
    try {
      await Api.delete("/api/profile/delete-image");
      updateProfile({ ...profile, profileImage: null });

      localStorage.setItem(
        "profile",
        JSON.stringify({ ...profile, profileImage: null })
      );
      
      toast.success("تم حذف الصورة من الملف الشخصي بنجاح");
    } catch (error) {
      console.log(error);
      toast.error("فشل حذف الصورة");
    }
  };

  const handleCancel = () => {
    form.setFieldsValue({
      fullName: profile?.fullName || "",
    });
    setIsEditing(false);
  };

  const imageMenu = (
    <Menu>
      <Menu.Item key="upload" icon={<UploadOutlined />}>
        <Upload
          showUploadList={false}
          beforeUpload={(file) => {
            handleImageUpload(file);
            return false;
          }}
        >
          رفع صورة
        </Upload>
      </Menu.Item>
      {profile?.profileImage && (
        <Menu.Item
          key="delete"
          icon={<DeleteOutlined />}
          onClick={handleImageDelete}
          danger
        >
          حذف الصورة
        </Menu.Item>
      )}
    </Menu>
  );

  if (isPageLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          gap: "16px",
        }}
      >
        <Title level={4} style={{ color: "#ff4d4f" }}>
          فشل في تحميل بيانات المستخدم
        </Title>
        <Text type="secondary" style={{ textAlign: "center" }}>
          حدث خطأ في تحميل بياناتك الشخصية. يرجى المحاولة مرة أخرى.
        </Text>
        <Button
          type="primary"
          onClick={loadUserData}
          style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>الملف الشخصي</title>
        <meta
          name="description"
          content="الملف الشخصي في نظام إدارة المساهمين"
        />
      </Helmet>
      <Content style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        <Card style={{ marginBottom: "24px", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Dropdown
              overlay={imageMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Avatar
                size={100}
                src={profile.profileImage}
                style={{
                  backgroundColor: "#28a745",
                  fontSize: "40px",
                  marginBottom: "16px",
                  cursor: "pointer",
                }}
                icon={<UserOutlined />}
              />
            </Dropdown>
            <Dropdown
              overlay={imageMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                shape="circle"
                icon={<MoreOutlined />}
                size="small"
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: -10,
                  backgroundColor: "#f5f5f5",
                }}
              />
            </Dropdown>
          </div>
          <Title level={2} style={{ color: "#28a745", marginBottom: "8px" }}>
            الملف الشخصي
          </Title>
          <Text type="secondary">إدارة معلوماتك الشخصية</Text>
        </Card>

        <Card
          title="المعلومات الشخصية"
          extra={
            !isEditing ? (
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setIsEditing(true)}
                >
                  تعديل
                </Button>
                <Button
                  icon={<LockOutlined />}
                  onClick={() => setIsPasswordModalVisible(true)}
                >
                  تغيير كلمة المرور
                </Button>
              </Space>
            ) : (
              <Space>
                <Button
                  icon={<SaveOutlined />}
                  type="primary"
                  onClick={() => form.submit()}
                  loading={isLoading}
                  style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
                >
                  حفظ
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
              </Space>
            )
          }
        >
          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              fullName: profile.fullName || "",
            }}
          >
            <Row gutter={[16, 0]} justify="center">
              <Col xs={24} md={20}>
                <Form.Item
                  label="الاسم الكامل"
                  name="fullName"
                  rules={[{ required: true, message: "الاسم الكامل مطلوب" }]}
                >
                  <Input
                    size="large"
                    prefix={<UserOutlined style={{ color: "#28a745" }} />}
                    disabled={!isEditing || isLoading}
                    placeholder="أدخل الاسم الكامل"
                    style={{ textAlign: "center" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]} justify="center">
              <Col xs={24} md={20}>
                <Form.Item label="البريد الإلكتروني">
                  <Input
                    size="large"
                    value={profile.email || "غير محدد"}
                    disabled
                    prefix={<MailOutlined style={{ color: "#666" }} />}
                    style={{ textAlign: "center" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={20}>
                <Form.Item label="الدور الوظيفي">
                  <Input
                    size="large"
                    value={
                      profile.role === "ADMIN" ? "مدير النظام" : "مستخدم عادي"
                    }
                    disabled
                    prefix={
                      <SafetyCertificateOutlined style={{ color: "#666" }} />
                    }
                    style={{ textAlign: "center" }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Modal
          title="تغيير كلمة المرور"
          visible={isPasswordModalVisible}
          onCancel={() => {
            setIsPasswordModalVisible(false);
            passwordForm.resetFields();
          }}
          footer={null}
          centered
          width={400}
          dir={"rtl"}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordUpdate}
          >
            <Form.Item
              name="oldPassword"
              label="كلمة المرور الحالية"
              rules={[
                { required: true, message: "كلمة المرور الحالية مطلوبة" },
              ]}
            >
              <Input.Password size="large" style={{ textAlign: "center" }} />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="كلمة المرور الجديدة"
              rules={[
                { required: true, message: "كلمة المرور الجديدة مطلوبة" },
                { min: 6, message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
              ]}
            >
              <Input.Password size="large" style={{ textAlign: "center" }} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="تأكيد كلمة المرور"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "تأكيد كلمة المرور مطلوب" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("كلمات المرور غير متطابقة")
                    );
                  },
                }),
              ]}
            >
              <Input.Password size="large" style={{ textAlign: "center" }} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
              >
                تحديث كلمة المرور
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </>
  );
};

export default Profile;