import React from "react";
import { PRESET_LAYOUT_CONFIGS } from "@/utils/presetLayouts";

export interface CardTheme {
  primary: string;
  secondary: string;
  background: string;
  textMain: string;
  textSub: string;
}

interface IdCardProps {
  layout: number;
  theme: CardTheme;
  school: {
    name: string;
    caption?: string;
    address?: string;
    logoUrl: string;
    signatureUrl?: string;
    phone?: string;
    customValues?: any;
    customFieldsConfig?: any;
    idCardLayoutConfig?: any;
  };
  student: {
    name: string;
    fatherName?: string;
    fatherPhone?: string;
    address?: string;
    profilePictureUrl?: string;
    idNo?: string;
    camSno?: string;
    motherName?: string;
    motherPhone?: string;
    customValues?: any;
  };
  classNameStr: string;
  classCustomValues?: any;
  hideFields?: boolean;
}

export default function IdCard({
  layout,
  theme,
  school,
  student,
  classNameStr,
  classCustomValues,
  hideFields = false,
}: IdCardProps) {
  const cardContainerStyle = {
    width: "673px",
    height: "1087px",
    backgroundColor: theme.background,
    border: "0.1px solid black",
  };

  let layoutConfig = school.idCardLayoutConfig;
  if (typeof layoutConfig === "string") {
    try {
      layoutConfig = JSON.parse(layoutConfig);
    } catch {
      layoutConfig = null;
    }
  }

  // --- BACKGROUND RENDERING FOR PRESET LAYOUTS ---
  const renderBackground = () => {
    switch (layout) {
      case 1:
        return (
          <div
            className="absolute top-0 left-0 w-full h-85 rounded-b-[50%] z-0"
            style={{ backgroundColor: theme.primary }}
          ></div>
        );
      case 2:
        return (
          <div
            className="absolute top-0 left-0 w-full h-100 z-0"
            style={{
              backgroundColor: theme.primary,
              clipPath: "polygon(0 0, 100% 0, 100% 60%, 0% 100%)",
            }}
          ></div>
        );
      case 3:
        return (
          <div
            className="absolute inset-9 z-0 border-[6px]"
            style={{ borderColor: theme.primary }}
          ></div>
        );
      case 4:
        return (
          <div
            className="absolute top-0 bottom-0 left-0 w-20 z-0"
            style={{ backgroundColor: theme.primary }}
          ></div>
        );
      case 5:
        return (
          <>
            <div
              className="absolute top-0 left-0 w-full h-[50%] z-0"
              style={{ backgroundColor: theme.primary }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-full h-[50%] z-0"
              style={{ backgroundColor: theme.secondary }}
            ></div>
          </>
        );
      case 6:
        return (
          <div
            className="absolute bottom-0 left-0 w-full h-87.5 rounded-t-[50%] z-0"
            style={{ backgroundColor: theme.primary }}
          ></div>
        );
      case 7:
        return (
          <>
            <div
              className="absolute top-0 left-0 w-full h-50 z-0"
              style={{ backgroundColor: theme.primary }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-full h-37.5 z-0"
              style={{ backgroundColor: theme.secondary }}
            ></div>
          </>
        );
      case 8:
        return (
          <>
            <div
              className="absolute top-0 left-0 w-full h-[50%] z-0"
              style={{
                backgroundColor: theme.primary,
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 80%)",
              }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-full h-[50%] z-0"
              style={{
                backgroundColor: theme.secondary,
                clipPath: "polygon(0 20%, 100% 0, 100% 100%, 0 100%)",
              }}
            ></div>
          </>
        );
      case 9:
        return (
          <div
            className="absolute top-0 right-0 w-80 h-80 z-0"
            style={{
              backgroundColor: theme.primary,
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          ></div>
        );
      case 10:
        return (
          <div className="absolute inset-0 z-0 bg-[url('@/assets/idcard-layout-10.jpeg')] bg-cover bg-center bg-no-repeat" />
        );
      case 11:
        return (
          <div className="absolute inset-0 z-0 bg-[url('@/assets/id-card-layout-11.jpeg')] bg-cover bg-center bg-no-repeat" />
        );
      case 12:
        return (
          <div className="absolute inset-0 z-0 bg-[url('@/assets/id-card-layout-12.jpeg')] bg-cover bg-center bg-no-repeat" />
        );
      default:
        return null;
    }
  };

  let fields = layoutConfig?.fields;
  if ((!fields || Object.keys(fields).length === 0) && layout >= 1 && layout <= 12) {
    fields = PRESET_LAYOUT_CONFIGS[layout]?.fields || {};
  } else {
    fields = fields || {};
  }

  const isCustomOrShared = layout === 0 || layout >= 13;
  const backgroundUrl = layoutConfig?.backgroundUrl;

  const customCardStyle = {
    width: "673px",
    height: "1087px",
    backgroundColor: theme.background,
    backgroundImage: isCustomOrShared && backgroundUrl ? `url(${backgroundUrl})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative" as const,
    overflow: "hidden" as const,
    border: "0.1px solid black",
  };

  return (
    <div className="relative box-border overflow-hidden mx-auto shadow-2xl" style={customCardStyle}>
      {!isCustomOrShared && renderBackground()}

      {!hideFields && Object.entries(fields).map(([fieldKey, f]: [string, any]) => {
        if (!f || !f.visible) return null;

        const isMultiline =
          fieldKey === "school_address" ||
          fieldKey === "student_address" ||
          fieldKey === "school_name" ||
          fieldKey === "school_caption";

        const align = f.align || "left";
        const scaleX = f.scaleX || 1;
        const scaleY = f.scaleY || 1;

        let leftPos = `${f.x}px`;
        let transformStr = `scale(${scaleX}, ${scaleY})`;
        let transformOriginStr = "top left";

        if (align === "center") {
          const centerX = f.width ? f.x + f.width / 2 : (f.x > 0 && f.x < 336.5 ? 336.5 : f.x);
          leftPos = `${centerX}px`;
          transformStr = `translate(-50%, 0) scale(${scaleX}, ${scaleY})`;
          transformOriginStr = "top center";
        } else if (align === "right") {
          const rightX = f.width ? f.x + f.width : f.x;
          leftPos = `${rightX}px`;
          transformStr = `translate(-100%, 0) scale(${scaleX}, ${scaleY})`;
          transformOriginStr = "top right";
        }

        const fieldStyle: React.CSSProperties = {
          position: "absolute",
          left: leftPos,
          top: `${f.y}px`,
          width: f.width ? `${f.width}px` : undefined,
          height: f.height ? `${f.height}px` : undefined,
          fontFamily: f.fontFamily ? `'${f.fontFamily}', sans-serif` : undefined,
          fontSize: f.fontSize ? `${f.fontSize}px` : undefined,
          fontWeight: f.fontWeight || undefined,
          color: f.color || undefined,
          textAlign: align as React.CSSProperties["textAlign"],
          zIndex: 20, // Ensure fields are above background elements
          whiteSpace: isMultiline ? "normal" : "nowrap",
          transform: transformStr,
          transformOrigin: transformOriginStr,
        };

        if (fieldKey === "school_logo") {
          return school.logoUrl ? (
            <img
              key={fieldKey}
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              style={fieldStyle}
              className="object-fit"
            />
          ) : null;
        }

        if (fieldKey === "student_photo") {
          return student.profilePictureUrl ? (
            <img
              key={fieldKey}
              src={student.profilePictureUrl}
              alt="Student"
              crossOrigin="anonymous"
              style={{ ...fieldStyle, borderRadius: f.borderRadius || "0" }}
              className="object-fit"
            />
          ) : null;
        }

        if (fieldKey === "principal_signature") {
          return school.signatureUrl ? (
            <img
              key={fieldKey}
              src={school.signatureUrl}
              alt="Sign"
              crossOrigin="anonymous"
              style={fieldStyle}
              className="object-fit"
            />
          ) : null;
        }

        let textContent = "";
        let labelPrefix = "";

        if (fieldKey === "school_name") {
          textContent = school.name;
        } else if (fieldKey === "school_caption") {
          textContent = school.caption || "";
        } else if (fieldKey === "school_address") {
          textContent = school.address || "";
        } else if (fieldKey === "school_phone") {
          textContent = school.phone || "";
        } else if (fieldKey === "student_name") {
          textContent = student.name;
        } else if (fieldKey === "class_name") {
          textContent = classNameStr;
          labelPrefix = "Class: ";
        } else if (fieldKey === "student_idNo") {
          textContent = student.idNo || "";
          labelPrefix = "ID No: ";
        } else if (fieldKey === "student_camSno") {
          textContent = student.camSno || "";
          labelPrefix = "CAM S.No: ";
        } else if (fieldKey === "student_fatherName") {
          textContent = student.fatherName || "";
          labelPrefix = "F's Name: ";
        } else if (fieldKey === "student_motherName") {
          let customVals = student.customValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = (student as any).motherName || customVals?.motherName || customVals?.mother_name || "";
          labelPrefix = "M's Name: ";
        } else if (fieldKey === "student_fatherPhone") {
          textContent = student.fatherPhone || "";
          labelPrefix = "Cell: ";
        } else if (fieldKey === "student_motherPhone") {
          let customVals = student.customValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = (student as any).motherPhone || customVals?.motherPhone || customVals?.mother_phone || "";
          labelPrefix = "Cell: ";
        } else if (fieldKey === "student_address") {
          textContent = student.address || "";
          labelPrefix = "Address: ";
        } else if (fieldKey.startsWith("student_custom_")) {
          const k = fieldKey.replace("student_custom_", "");
          let customVals = student.customValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = customVals?.[k] || "";
          labelPrefix = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
        } else if (fieldKey.startsWith("school_custom_")) {
          const k = fieldKey.replace("school_custom_", "");
          let customVals = school.customValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = customVals?.[k] || "";
          labelPrefix = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
        } else if (fieldKey.startsWith("class_custom_")) {
          const k = fieldKey.replace("class_custom_", "");
          let customVals = classCustomValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = customVals?.[k] || "";
          labelPrefix = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
        }

        if (!textContent) return null;

        return (
          <div key={fieldKey} style={fieldStyle} className="leading-tight">
            {f.labelVisible !== false && labelPrefix ? (
              <span className="font-bold opacity-85 mr-1">{labelPrefix}</span>
            ) : null}
            <span>{textContent}</span>
          </div>
        );
      })}
    </div>
  );
}
