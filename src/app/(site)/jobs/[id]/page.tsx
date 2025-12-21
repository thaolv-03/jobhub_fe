'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { MapPin, DollarSign, Briefcase, Bookmark, Share2, CalendarClock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Container } from "@/components/layout/container";

const allJobs = [
  {
    id: "1",
    title: "Kỹ sư phần mềm (ReactJS, NodeJS)",
    company: "FPT Software",
    location: "Hà Nội",
    min_salary: 25,
    max_salary: 50,
    job_type: "Toàn thời gian",
    deadline: new Date("2024-12-31"),
    logoId: "company-logo-fpt",
    description: "<p>Chúng tôi đang tìm kiếm một Kỹ sư phần mềm tài năng để tham gia vào đội ngũ phát triển sản phẩm của chúng tôi. Bạn sẽ làm việc với các công nghệ mới nhất như ReactJS và NodeJS để xây dựng các ứng dụng web hiệu suất cao.</p><h3>Trách nhiệm công việc:</h3><ul><li>Phát triển và bảo trì giao diện người dùng bằng ReactJS.</li><li>Xây dựng và quản lý các API phía máy chủ bằng NodeJS.</li><li>Làm việc với cơ sở dữ liệu MongoDB và PostgreSQL.</li><li>Hợp tác với các thành viên trong nhóm để thiết kế và triển khai các tính năng mới.</li><li>Viết mã sạch, dễ bảo trì và có khả năng mở rộng.</li></ul>",
    requirements: ["Ít nhất 2 năm kinh nghiệm với ReactJS và NodeJS.", "Có kinh nghiệm làm việc với RESTful APIs.", "Kiến thức về Redux, MobX là một lợi thế.", "Kỹ năng giải quyết vấn đề tốt.", "Tiếng Anh giao tiếp cơ bản."],
    skills: ["ReactJS", "NodeJS", "JavaScript", "MongoDB", "Git"]
  },
  {
    id: "2",
    title: "Chuyên viên phân tích dữ liệu",
    company: "Viettel",
    location: "Đà Nẵng",
    min_salary: 35,
    max_salary: 60,
    job_type: "Toàn thời gian",
    deadline: new Date("2024-11-30"),
    logoId: "company-logo-viettel",
    description: "<p>Viettel đang tuyển dụng Chuyên viên phân tích dữ liệu để tham gia vào các dự án lớn về Big Data và AI. Bạn sẽ có cơ hội làm việc trong môi trường chuyên nghiệp và năng động.</p><h3>Mô tả công việc:</h3><ul><li>Thu thập, xử lý và phân tích dữ liệu từ nhiều nguồn khác nhau.</li><li>Xây dựng các mô hình dự báo, phân loại.</li><li>Trực quan hóa dữ liệu và trình bày kết quả cho các bên liên quan.</li></ul>",
    requirements: ["Tốt nghiệp Đại học chuyên ngành Toán tin, CNTT, hoặc các ngành liên quan.", "Có kinh nghiệm với SQL, Python/R.", "Hiểu biết về các thuật toán Machine Learning.", "Có khả năng làm việc độc lập và làm việc nhóm tốt."],
    skills: ["SQL", "Python", "Machine Learning", "Data Analysis", "PowerBI"]
  },
  {
    id: "3",
    title: "UI/UX Designer",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh",
    min_salary: 20,
    max_salary: 30,
    job_type: "Hợp đồng",
    deadline: new Date("2024-12-15"),
    logoId: "company-logo-vng",
    description: "<p>Tham gia vào đội ngũ thiết kế của VNG để tạo ra những sản phẩm có trải nghiệm người dùng xuất sắc, ảnh hưởng đến hàng triệu người dùng tại Việt Nam và Đông Nam Á.</p><h3>Bạn sẽ làm gì?</h3><ul><li>Nghiên cứu và phân tích nhu cầu người dùng.</li><li>Tạo wireframe, mockup, và prototype.</li><li>Phối hợp chặt chẽ với Product Manager và đội ngũ phát triển.</li></ul>",
    requirements: ["Có ít nhất 1 năm kinh nghiệm ở vị trí tương đương.", "Sử dụng thành thạo Figma, Sketch, hoặc Adobe XD.", "Có portfolio chất lượng.", "Tư duy thiết kế tốt, cập nhật xu hướng mới."],
    skills: ["Figma", "UI Design", "UX Research", "Prototyping"]
  },
];

export default function JobDetailPage() {
  const params = useParams();
  const jobData = allJobs.find((job) => job.id === params.id);
  const bannerImage = PlaceHolderImages.find((p) => p.id === "job-detail-banner");

  if (!jobData) {
    return (
      <Container className="py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Không tìm thấy việc làm</h1>
          <p className="text-muted-foreground mt-4">Công việc bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Button asChild className="mt-6">
            <Link href="/jobs">Quay lại danh sách</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const companyLogo = PlaceHolderImages.find((p) => p.id === jobData.logoId);

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <Container className="py-8">
          <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-8">
            {bannerImage && (
              <Image
                src={bannerImage.imageUrl}
                alt="Job Banner"
                fill
                style={{ objectFit: "cover" }}
                data-ai-hint={bannerImage.imageHint}
              />
            )}
          </div>

          <div className="bg-card border rounded-xl p-6 md:p-8 -mt-20 relative z-10 max-w-4xl mx-auto shadow-lg">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {companyLogo && (
                <Image
                  src={companyLogo.imageUrl}
                  alt={`${jobData.company} logo`}
                  width={80}
                  height={80}
                  className="rounded-md border p-1"
                  data-ai-hint={companyLogo.imageHint}
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">{jobData.title}</h1>
                <Link href="#" className="text-lg text-primary hover:underline">{jobData.company}</Link>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> {jobData.location}</p>
                  <p className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> {jobData.min_salary} - {jobData.max_salary} triệu</p>
                  <p className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> {jobData.job_type}</p>
                  {jobData.deadline && (
                    <p className="flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Hạn nộp: {format(jobData.deadline, "dd/MM/yyyy")}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="icon"><Bookmark /></Button>
                <Button variant="outline" size="icon"><Share2 /></Button>
                <Button size="lg" className="ml-2">Ứng tuyển ngay</Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Mô tả công việc</h2>
                <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: jobData.description }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Yêu cầu kỹ năng</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {jobData.requirements.map((req, i) => <li key={i}>{req}</li>)}
                </ul>
              </div>
            </div>
            <div className="md:col-span-1 space-y-6">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Kỹ năng</h3>
                <div className="flex flex-wrap gap-2">
                  {jobData.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                </div>
              </div>
              <div className="bg-card border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Về {jobData.company}</h3>
                <p className="text-sm text-muted-foreground">FPT Software là công ty công nghệ toàn cầu với hơn 20,000 nhân viên, cung cấp các giải pháp và dịch vụ CNTT hàng đầu tại Việt Nam và trên thế giới.</p>
                <Button variant="link" className="p-0 mt-2">Tìm hiểu thêm</Button>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
