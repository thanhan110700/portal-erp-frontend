import { useState } from "react";
import { Form, Input, Checkbox, Button, Alert } from "antd";
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

import { loginApi } from "@/features/auth/api";
import type { User } from "@/shared/types";

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

interface LoginFormProps {
  defaultEmail?: string;
  onSuccess: (user: User, token: string) => void;
  submitLabel?: string;
}

export function LoginForm({
  defaultEmail,
  onSuccess,
  submitLabel = "Continue",
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm<LoginFormValues>();

  const onFinish = async (values: LoginFormValues) => {
    try {
      setError(null);
      setIsSubmitting(true);
      const { user, token } = await loginApi.login(values);
      onSuccess(user, token);
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (e.response?.status === 422) {
        setError(e.response.data?.message || "Invalid credentials provided.");
      } else if (e.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert message={error} type="error" showIcon className="!rounded-lg" />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => void onFinish(values)}
        initialValues={{
          email: defaultEmail ?? "",
          password: "",
          remember: false,
        }}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="email"
          label="Email address"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Invalid email address" },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-zinc-400" />}
            placeholder="name@company.com"
            type="email"
            autoComplete="email"
            readOnly={!!defaultEmail}
            className="!rounded-[10px]"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Password is required" }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-zinc-400" />}
            placeholder="••••••••"
            autoComplete="current-password"
            className="!rounded-[10px]"
          />
        </Form.Item>

        <Form.Item name="remember" valuePropName="checked" className="!mb-6">
          <Checkbox>Remember my device</Checkbox>
        </Form.Item>

        <Form.Item className="!mb-0">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isSubmitting}
            icon={isSubmitting ? <LoadingOutlined /> : <ArrowRightOutlined />}
            iconPosition="end"
            className="!h-12 !rounded-[10px] !text-[15px] font-semibold"
          >
            {isSubmitting ? "Authenticating..." : submitLabel}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
