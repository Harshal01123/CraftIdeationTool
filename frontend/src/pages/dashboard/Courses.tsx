import { useState } from "react";
import CourseCategory from "../../components/courses/CourseCategory";
import styles from "./Courses.module.css";

const courseCategories = [
  {
    title: "Pottery Videos",
    videos: [
      { title: "Clay Basics", youtubeId: "-YCGK33c0xs" },
      { title: "Wheel Throwing", youtubeId: "9bZkp7q19f0" },
      { title: "Glazing 101", youtubeId: "3tmd-ClpJxA" },
      { title: "Advanced Pottery", youtubeId: "l482T0yNkeo" },
    ],
  },
  {
    title: "Bamboo Making Videos",
    videos: [
      { title: "Bamboo Selection", youtubeId: "RgKAFK5djSk" },
      { title: "Cutting Techniques", youtubeId: "OPf0YbXqDm0" },
      { title: "Weaving Basics", youtubeId: "hT_nvWreIhg" },
      { title: "Finishing", youtubeId: "fLexgOxsZu0" },
    ],
  },
  {
    title: "Glass Decorating Videos",
    videos: [
      { title: "Glass Safety", youtubeId: "uelHwf8o7_U" },
      { title: "Color Techniques", youtubeId: "CevxZvSJLk8" },
      { title: "Etching Basics", youtubeId: "kXYiU_JCYtU" },
      { title: "Polishing", youtubeId: "ktvTqknDobU" },
    ],
  },
  {
    title: "Painting Videos",
    videos: [
      { title: "Brush Techniques", youtubeId: "60ItHLz5WEA" },
      { title: "Color Theory", youtubeId: "YQHsXMglC9A" },
      { title: "Acrylic Painting", youtubeId: "e-ORhEE9VVg" },
      { title: "Landscape Art", youtubeId: "JGwWNGJdvx8" },
    ],
  },
];

function Courses() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Courses</h2>

      {courseCategories.map((category) => (
        <CourseCategory
          key={category.title}
          title={category.title}
          videos={category.videos}
          onCardClick={setActiveVideo}
        />
      ))}

      {/* ================= VIDEO OVERLAY ================= */}
      {activeVideo && (
        <div
          className={styles.overlay}
          onClick={() => setActiveVideo(null)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.close}
              onClick={() => setActiveVideo(null)}
            >
              ✕
            </button>

            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="Course Video"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
