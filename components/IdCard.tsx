import React from "react";

export interface CardTheme {
  primary: string;
  secondary: string;
  background: string;
  textMain: string;
  textSub: string;
  schoolNameFont?: string;
  schoolNameSize?: string;
  schoolNameWeight?: string;
  schoolCaptionFont?: string;
  schoolCaptionSize?: string;
  schoolCaptionWeight?: string;
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
  };
  student: {
    name: string;
    fatherName: string;
    fatherPhone: string;
    address: string;
    profilePictureUrl: string;
  };
  classNameStr: string;
}

export default function IdCard({
  layout,
  theme,
  school,
  student,
  classNameStr,
}: IdCardProps) {
  // OUTER CONTAINER: Represents the physical uncut paper (638x1013). Backgrounds bleed to the edges of this.
  const cardContainerStyle = {
    width: "673px",
    height: "1087px",
    backgroundColor: theme.background,
    border: "0.1px solid black", // Ensures the container is recognized for bleed even if background is white
  };

  // INNER SAFE ZONE: 24px padding ensures no content gets cut off by the blade.
  const safeZoneClass = "relative z-10 flex flex-col h-full p-6";

  const schoolNameStyle = {
    fontFamily: theme.schoolNameFont ? `'${theme.schoolNameFont}', sans-serif` : undefined,
    fontSize: theme.schoolNameSize ? `${theme.schoolNameSize}px` : undefined,
    fontWeight: theme.schoolNameWeight || undefined,
  };

  const schoolCaptionStyle = {
    fontFamily: theme.schoolCaptionFont ? `'${theme.schoolCaptionFont}', sans-serif` : undefined,
    fontSize: theme.schoolCaptionSize ? `${theme.schoolCaptionSize}px` : undefined,
    fontWeight: theme.schoolCaptionWeight || undefined,
  };

  // Helper to render the required student details consistently across layouts
  // v should be false default
  const renderStudentDetails = (
    textColor: string,
    align: "left" | "center" = "left",
    v: boolean = false,
  ) => (
    <div
      className={`w-full max-w-125 flex flex-col text-3xl mt-4 ${align === "center" ? "mx-auto" : ""}`}
      style={{ color: textColor }}
    >
      <div className="flex pb-2 gap-2 mb-2">
        <span className="font-bold w-40 opacity-80">F's Name</span>
        <span>:</span>
        <span className="font-bold uppercase flex-1 text-left">
          {student.fatherName}
        </span>
      </div>
      <div className="flex pb-2 gap-2 mb-2">
        <span className="font-bold w-40 opacity-80">Cell</span>
        <span>:</span>
        <span className="font-bold flex-1 text-left">
          {student.fatherPhone}
        </span>
      </div>
      <div className="flex pb-2 gap-2">
        <span className="font-bold w-40 opacity-80">
          {v ? "Village" : "Address"}
        </span>
        <span>:</span>
        <span className="font-bold leading-snug flex-1 text-left">
          {student.address}
        </span>
      </div>
    </div>
  );

  // Helper to render the signature block
  const renderSignature = (
    textColor: string,
    bgColor: string = "transparent",
    boxPadding: string = "px-4 py-2",
  ) => (
    <div className="mt-auto flex justify-end w-full pt-4 pr-2.5">
      <div className="flex flex-col items-center">
        {school.signatureUrl ? (
          <img
            src={school.signatureUrl}
            alt="Sign"
            crossOrigin="anonymous"
            className="h-14 object-contain mb-1"
          />
        ) : (
          <div className="h-14 mb-1"></div>
        )}
        <div className={`text-center pt-1 border-t-2 border-gray-400`}>
          <span
            className={`text-sm font-bold uppercase rounded-full ${boxPadding}`}
            style={{ color: textColor, backgroundColor: bgColor }}
          >
            Principal Sign
          </span>
        </div>
      </div>
    </div>
  );

  // --- LAYOUT 1: Standard Top Curve ---
  if (layout === 1) {
    return (
      <div
        className="relative box-border overflow-hidden mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed Background */}
        <div
          className="absolute top-0 left-0 w-full h-85 rounded-b-[50%] z-0"
          style={{ backgroundColor: theme.primary }}
        ></div>

        {/* Safe Zone */}
        <div className={safeZoneClass}>
          <div className="flex flex-col items-center text-center mt-2">
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-24 h-24 p-2 bg-white rounded-full shadow-lg mb-2 object-contain"
            />
            <h1
              className="text-4xl font-extrabold uppercase tracking-wider drop-shadow-md px-2 leading-tight"
              style={{ color: theme.textMain, ...schoolNameStyle }}
            >
              {school.name}
            </h1>
            {school.caption && (
              <p
                className="text-xl italic font-medium mt-1"
                style={{ color: theme.textMain, ...schoolCaptionStyle }}
              >
                {school.caption}
              </p>
            )}
            {school.address && (
              <p
                className="text-lg mt-1 opacity-90"
                style={{ color: theme.textMain }}
              >
                {school.address}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center mt-6">
            <div
              className="w-72 h-72"
              
            >
              <img
                src={student.profilePictureUrl}
                alt={student.name}
                crossOrigin="anonymous"
                className="w-full h-full "
              />
            </div>
            <h2
              className="text-5xl font-black mt-6 uppercase text-center tracking-tight"
              style={{ color: theme.primary }}
            >
              {student.name}
            </h2>
            <div
              className="mt-4 px-6 py-2 rounded-full font-bold text-3xl shadow-sm"
              style={{ backgroundColor: theme.secondary, color: theme.primary }}
            >
              Class: {classNameStr}
            </div>
          </div>
          <div className="grow flex flex-col justify-center px-4">
            {renderStudentDetails(theme.textSub)}
          </div>
          {renderSignature(theme.primary, theme.secondary)}
        </div>
      </div>
    );
  }

  // --- LAYOUT 2: Sharp Diagonal Split ---
  if (layout === 2) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed Background */}
        <div
          className="absolute top-0 left-0 w-full h-100 z-0"
          style={{
            backgroundColor: theme.primary,
            clipPath: "polygon(0 0, 100% 0, 100% 60%, 0% 100%)",
          }}
        ></div>

        <div className={safeZoneClass}>
          <div className="flex items-center gap-4 mt-2 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-20 h-20 object-contain bg-white rounded-lg p-1 shadow-md"
            />
            <div className="flex flex-col text-left">
              <h1
                className="text-3xl font-extrabold uppercase leading-tight"
                style={{ color: theme.textMain, ...schoolNameStyle }}
              >
                {school.name}
              </h1>
              {school.caption && (
                <p className="text-lg italic" style={{ color: theme.textMain, ...schoolCaptionStyle }}>
                  {school.caption}
                </p>
              )}
              <p className="text-sm" style={{ color: theme.textMain }}>
                {school.address}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center mt-10">
            <img
              src={student.profilePictureUrl}
              alt={student.name}
              crossOrigin="anonymous"
              className="w-72 h-72"
            />
          </div>

          <div className="flex flex-col mt-8 grow px-2">
            <h2
              className="text-5xl font-black mb-2 uppercase"
              style={{ color: theme.primary }}
            >
              {student.name}
            </h2>
            <p
              className="text-3xl font-bold mb-6"
              style={{ color: theme.textSub }}
            >
              Class:{" "}
              <span style={{ color: theme.primary }}>{classNameStr}</span>
            </p>
            {renderStudentDetails(theme.textSub)}
          </div>
          {renderSignature(theme.textSub)}
        </div>
      </div>
    );
  }

  // --- LAYOUT 3: Elegant Inset Border ---
  if (layout === 3) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed-Proof Border: Placed 36px inward so after a 24px cut, an elegant 12px margin remains around the border */}
        <div
          className="absolute inset-9 z-0 border-[6px]"
          style={{ borderColor: theme.primary }}
        ></div>

        <div className={safeZoneClass}>
          <div className="flex flex-col items-center text-center mt-6">
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-20 h-20 object-contain mb-3"
            />
            <h1
              className="text-4xl font-black uppercase tracking-widest px-8"
              style={{ color: theme.primary, ...schoolNameStyle }}
            >
              {school.name}
            </h1>
            <p className="text-lg px-10" style={{ color: theme.textSub }}>
              {school.address}
            </p>
          </div>

          <div className="flex justify-center mt-8">
            <div
              className="w-72 h-72"
              style={{ borderColor: theme.secondary }}
            >
              <img
                src={student.profilePictureUrl}
                alt={student.name}
                crossOrigin="anonymous"
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="flex flex-col items-center mt-8 grow text-center px-6">
            <h2
              className="text-5xl font-bold uppercase tracking-widest mb-4"
              style={{ color: theme.primary }}
            >
              {student.name}
            </h2>
            <span
              className="px-10 py-2 text-3xl font-bold uppercase rounded-sm mb-6"
              style={{ backgroundColor: theme.primary, color: theme.textMain }}
            >
              Class: {classNameStr}
            </span>
            {renderStudentDetails(theme.textSub, "center")}
          </div>

          <div className="mb-4 px-6">{renderSignature(theme.primary)}</div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 4: Left Vertical Ribbon ---
  if (layout === 4) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed Background: 80px wide. After 24px cut on left, 56px ribbon remains */}
        <div
          className="absolute top-0 bottom-0 left-0 w-20 z-0"
          style={{ backgroundColor: theme.primary }}
        ></div>

        {/* Safe Zone pushed inward to avoid the ribbon */}
        <div
          className={`relative z-10 flex flex-col h-full pt-6 pr-6 pb-6 pl-22.5`}
        >
          <div
            className="flex justify-between items-start border-b-4 pb-4 mt-2"
            style={{ borderColor: theme.secondary }}
          >
            <div className="pr-2">
              <h1
                className="text-4xl font-black uppercase leading-tight"
                style={{ color: theme.primary, ...schoolNameStyle }}
              >
                {school.name}
              </h1>
              <p className="text-lg text-gray-500 mt-1">{school.address}</p>
            </div>
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-20 h-20 object-contain"
            />
          </div>

          <div className="flex justify-center mt-10 mb-8">
            <img
              src={student.profilePictureUrl}
              alt={student.name}
              crossOrigin="anonymous"
              className="w-72 h-72"
              style={{ borderColor: theme.secondary }}
            />
          </div>

          <h2
            className="text-5xl font-black uppercase mb-2"
            style={{ color: "#1f2937" }}
          >
            {student.name}
          </h2>
          <div
            className="inline-block px-6 py-2 rounded-lg font-bold text-3xl mb-8 self-start"
            style={{ backgroundColor: theme.primary, color: theme.textMain }}
          >
            Class: {classNameStr}
          </div>

          <div
            className="border-l-4 pl-4"
            style={{ borderColor: theme.secondary }}
          >
            {renderStudentDetails(theme.textSub)}
          </div>

          {renderSignature(theme.textSub)}
        </div>
      </div>
    );
  }

  // --- LAYOUT 5: Top/Bottom Split (Two-Tone) ---
  if (layout === 5) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed Backgrounds */}
        <div
          className="absolute top-0 left-0 w-full h-[50%] z-0"
          style={{ backgroundColor: theme.primary }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-full h-[50%] z-0"
          style={{ backgroundColor: theme.secondary }}
        ></div>

        <div className={safeZoneClass}>
          <div className="flex flex-col items-center mt-4">
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-24 h-24 bg-white p-2 rounded-xl object-contain shadow-lg mb-4"
            />
            <h1
              className="text-4xl font-extrabold uppercase text-center leading-tight"
              style={{ color: theme.textMain, ...schoolNameStyle }}
            >
              {school.name}
            </h1>
            <p
              className="text-lg mt-2 text-center"
              style={{ color: theme.textMain }}
            >
              {school.address}
            </p>
          </div>

          <div className="flex justify-center my-8">
            <div
              className="w-72 h-72 border-8 box-content"
            >
              <img
                src={student.profilePictureUrl}
                alt={student.name}
                crossOrigin="anonymous"
                className="w-full h-full"
              />
            </div>
          </div>

          <div
            className="flex flex-col items-center grow bg-white rounded-3xl shadow-xl p-8 text-center border-t-8"
            style={{ borderColor: theme.primary }}
          >
            <h2
              className="text-5xl font-black uppercase mb-4"
              style={{ color: theme.primary }}
            >
              {student.name}
            </h2>
            <div
              className="text-3xl font-bold mb-6 px-8 py-2 rounded-full border-2"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              Class: {classNameStr}
            </div>
            {renderStudentDetails(theme.textSub, "center")}
            <div className="mt-auto pt-4">
              {school.signatureUrl && (
                <img
                  src={school.signatureUrl}
                  alt="Sign"
                  crossOrigin="anonymous"
                  className="h-12 object-contain mx-auto"
                />
              )}
              <div
                className="border-t-2 pt-1 font-bold uppercase text-sm"
                style={{ color: theme.primary, borderColor: theme.primary }}
              >
                Principal Sign
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 6: Bottom Wave ---
  if (layout === 6) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed Background */}
        <div
          className="absolute bottom-0 left-0 w-full h-87.5 rounded-t-[50%] z-0"
          style={{ backgroundColor: theme.primary }}
        ></div>

        <div className={safeZoneClass}>
          <div
            className="flex justify-between items-center border-b-8 pb-4 mt-4"
            style={{ borderColor: theme.primary }}
          >
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-24 h-24 object-contain"
            />
            <div className="flex flex-col text-right">
              <h1
                className="text-3xl font-black uppercase"
                style={{ color: theme.primary, ...schoolNameStyle }}
              >
                {school.name}
              </h1>
              <p
                className="text-lg opacity-80"
                style={{ color: theme.textSub }}
              >
                {school.address}
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-12 mb-10">
            <img
              src={student.profilePictureUrl}
              alt={student.name}
              crossOrigin="anonymous"
              className="w-72 h-72 box-content border-8"
              style={{ borderColor: theme.secondary }}
            />
          </div>

          <h2
            className="text-6xl font-black uppercase text-center mb-6"
            style={{ color: theme.primary }}
          >
            {student.name}
          </h2>
          <div
            className="bg-gray-100 text-center py-3 rounded-xl mx-8 mb-8 text-3xl font-bold border-2"
            style={{ color: theme.textSub, borderColor: theme.secondary }}
          >
            Class: {classNameStr}
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg mb-4">
            {renderStudentDetails(theme.textSub)}
          </div>

          {renderSignature(theme.textMain, "transparent")}
        </div>
      </div>
    );
  }

  // --- LAYOUT 7: Top & Bottom Bold Bars ---
  if (layout === 7) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed Backgrounds */}
        <div
          className="absolute top-0 left-0 w-full h-50 z-0"
          style={{ backgroundColor: theme.primary }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-full h-37.5 z-0"
          style={{ backgroundColor: theme.secondary }}
        ></div>

        <div className={safeZoneClass}>
          <div className="flex items-center gap-6 mt-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-2 shadow-md">
              <img
                src={school.logoUrl}
                alt="Logo"
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <h1 
                className="text-3xl font-extrabold uppercase text-white drop-shadow-md"
                style={schoolNameStyle}
              >
                {school.name}
              </h1>
              <p 
                className="text-lg text-white/90"
                style={schoolCaptionStyle}
              >
                {school.caption}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center mt-20">
            <img
              src={student.profilePictureUrl}
              alt={student.name}
              crossOrigin="anonymous"
              className="w-72 h-72"
              style={{ borderColor: theme.primary }}
            />
          </div>

          <div className="text-center mt-8 px-4 grow">
            <h2
              className="text-5xl font-black uppercase mb-4"
              style={{ color: theme.primary }}
            >
              {student.name}
            </h2>
            <span
              className="text-3xl font-bold px-8 py-2 rounded-full"
              style={{ backgroundColor: theme.primary, color: theme.textMain }}
            >
              Class: {classNameStr}
            </span>
            <div className="mt-8 text-left">
              {renderStudentDetails(theme.textSub)}
            </div>
          </div>

          <div className="flex justify-between items-end mt-auto text-white pb-2">
            <p
              className="text-sm max-w-62.5 font-medium"
              style={{ color: theme.primary }}
            >
              {school.address}
            </p>
            <div className="flex flex-col items-center">
              {school.signatureUrl && (
                <img
                  src={school.signatureUrl}
                  alt="Sign"
                  crossOrigin="anonymous"
                  className="h-12 object-contain mb-1"
                />
              )}
              <span
                className="text-sm font-bold uppercase border-t-2 border-white pt-1"
                style={{ color: theme.primary }}
              >
                Principal Sign
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 8: Right Triangle Accent ---
  if (layout === 8) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed Background: Top Right Triangle */}
        <div
          className="absolute right-0 top-0 w-100 h-100 z-0"
          style={{
            backgroundColor: theme.primary,
            clipPath: "polygon(100% 0, 100% 100%, 0 0)",
          }}
        ></div>
        <div
          className="absolute left-0 bottom-0 w-50 h-50 z-0"
          style={{
            backgroundColor: theme.secondary,
            clipPath: "polygon(0 0, 0 100%, 100% 100%)",
          }}
        ></div>

        <div className={safeZoneClass}>
          <div className="flex justify-between items-start mt-4">
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-28 h-28 object-contain bg-white/80 p-2 rounded-2xl shadow-sm backdrop-blur"
            />
            <div className="text-right w-2/3">
              <h1
                className="text-3xl font-extrabold uppercase leading-tight"
                style={{ color: theme.textMain, ...schoolNameStyle }}
              >
                {school.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-center mt-12 mb-10">
            <div
              className="w-72 h-72"
              
            >
              <img
                src={student.profilePictureUrl}
                alt={student.name}
                crossOrigin="anonymous"
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="flex flex-col text-left px-4 grow">
            <h2
              className="text-6xl font-black uppercase mb-2"
              style={{ color: theme.primary }}
            >
              {student.name}
            </h2>
            <p
              className="text-3xl font-bold mb-8"
              style={{ color: theme.textSub }}
            >
              Class:{" "}
              <span style={{ color: theme.primary }}>{classNameStr}</span>
            </p>
            {renderStudentDetails(theme.textSub)}
          </div>

          <div className="flex justify-end pr-4">
            {renderSignature(theme.primary)}
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 9: Symmetrical Side Bars ---
  if (layout === 9) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto"
        style={cardContainerStyle}
      >
        {/* Bleed Backgrounds: 40px wide borders. After 24px cut, 16px borders remain on both sides */}
        <div
          className="absolute top-0 bottom-0 left-0 w-10 z-0"
          style={{ backgroundColor: theme.primary }}
        ></div>
        <div
          className="absolute top-0 bottom-0 right-0 w-10 z-0"
          style={{ backgroundColor: theme.secondary }}
        ></div>

        {/* Safe Zone squeezed inward */}
        <div className={`relative z-10 flex flex-col h-full py-6 px-12`}>
          <div
            className="flex flex-col items-center text-center mt-6 border-b-4 pb-6"
            style={{ borderColor: theme.primary }}
          >
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-24 h-24 object-contain mb-4"
            />
            <h1
              className="text-4xl font-black uppercase"
              style={{ color: theme.primary, ...schoolNameStyle }}
            >
              {school.name}
            </h1>
            <p
              className="text-lg mt-2 font-medium"
              style={{ color: theme.textSub }}
            >
              {school.address}
            </p>
          </div>

          <div className="flex justify-center mt-12 mb-10">
            <img
              src={student.profilePictureUrl}
              alt={student.name}
              crossOrigin="anonymous"
              className="w-72 h-72"
            />
          </div>

          <div className="text-center mb-8">
            <h2
              className="text-5xl font-black uppercase mb-4"
              style={{ color: theme.primary }}
            >
              {student.name}
            </h2>
            <div
              className="inline-block px-10 py-2 text-2xl font-bold uppercase tracking-wider"
              style={{ backgroundColor: theme.primary, color: theme.textMain }}
            >
              Class: {classNameStr}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200">
            {renderStudentDetails(theme.textSub)}
          </div>

          {renderSignature(theme.primary)}
        </div>
      </div>
    );
  }
  // layout 10
  if (layout === 10) {
    return (
      <div className="relative box-border overflow-hidden shadow-2xl mx-auto w-168.25 h-271.75 bg-[url('@/assets/idcard-layout-10.jpeg')] bg-cover bg-center bg-no-repeat">
        {/* Dark overlay so text stays readable over the image */}
        <div className="absolute inset-0 z-0" />

        <div className={safeZoneClass}>
          {/* School header */}
          <div
            className="flex items-center gap-4 mt-2 rounded-2xl p-3"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(6px)",
            }}
          >
            <img
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              className="w-24 h-24 object-contain bg-white rounded-full p-1 shadow-lg shrink-0"
            />
            <div className="flex flex-col items-center justify-center w-full">
              <h1
                className="text-4xl font-extrabold uppercase leading-tight drop-shadow-lg"
                style={{ color: "#ffffff", ...schoolNameStyle }}
              >
                {school.name}
              </h1>
              {school.caption && (
                <p
                  className="text-xl italic drop-shadow-md"
                  style={{ color: "rgba(255,255,255,0.85)", ...schoolCaptionStyle }}
                >
                  {school.caption}
                </p>
              )}
              {school.address && (
                <p
                  className="text-lg drop-shadow-md"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {school.address}
                </p>
              )}
            </div>
          </div>

          {/* Student photo */}
          <div className="flex justify-center mt-20">
            <div
              className="w-72 h-72"
            >
              <img
                src={student.profilePictureUrl}
                alt={student.name}
                crossOrigin="anonymous"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Name + class badge */}
          <div className="flex flex-col items-center mt-36.5 gap-3">
            <h2
              className="text-5xl font-black uppercase text-center tracking-tight drop-shadow-lg"
              style={{
                color: "#ffffff",
                textShadow: "0 2px 8px rgba(0,0,0,0.7)",
              }}
            >
              {student.name}
            </h2>
            <div
              className="absolute right-4 top-[38%] px-8 py-2 size-32 text-4xl font-semibold shadow-lg "
              style={{ backgroundColor: theme.background, color: "black" }}
            >
              <p className="flex justify-center items-center ">Class</p>{" "}
              <p className="flex justify-center items-center mt-4">
                {classNameStr}
              </p>
            </div>
          </div>

          {/* Details panel */}
          <div
            className="mt-6 mx-2 rounded-2xl p-5 grow"
            style={{
              backgroundColor: "rgba(255,255,255,0.13)",
              backdropFilter: "blur(6px)",
            }}
          >
            {renderStudentDetails("#000", "center", true)}
          </div>

          {/* Signature */}
          <div className="mt-4 flex justify-end pr-4">
            <div className="flex flex-col items-center">
              {school.signatureUrl ? (
                <img
                  src={school.signatureUrl}
                  alt="Sign"
                  crossOrigin="anonymous"
                  className="h-12 object-contain mb-1"
                  // style={{ filter: "brightness(0) invert(1)" }}
                />
              ) : (
                <div className="h-12 mb-1" />
              )}
              <div>
                <span className="text-lg font-bold uppercase text-black drop-shadow">
                  Signature
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 11) {
    return (
    <div
      className="relative box-border overflow-hidden shadow-2xl mx-auto w-168.25 h-271.75 bg-[url('@/assets/id-card-layout-11.jpeg')] bg-cover bg-center bg-no-repeat"
      style={cardContainerStyle}
    >
      <div className={safeZoneClass}>
        {/* School header (Positioned over the top blue diagonal) */}
        <div className="flex flex-col items-center text-center mt-3">
          <div className="w-full flex items-center pl-2">
            <img
            src={school.logoUrl}
            alt="Logo"
            crossOrigin="anonymous"
            className="w-30 h-30 object-contain bg-white rounded-full p-1 shadow-md mb-3"
          />
          <div>
          <h1 
            className="text-5xl font-extrabold uppercase leading-tight drop-shadow-md text-white px-4"
            style={schoolNameStyle}
          >
            {school.name}
          </h1>
          {school.caption && (
            <p 
              className="text-[25px] italic drop-shadow-md text-white/90"
              style={schoolCaptionStyle}
            >
              {school.caption}
            </p>
          )}
          </div>
          </div>
          
          
          {school.address && (
            <p className="text-xl drop-shadow-md text-white/80 px-6">
              {school.address}
            </p>
          )}
        </div>

        {/* Spacer to push the student photo down into the white area of the background */}
        <div className="mt-25 flex flex-col items-center">
          {/* Student photo */}
          <div
            className="w-72 h-72"
          >
            <img
              src={student.profilePictureUrl}
              alt={student.name}
              crossOrigin="anonymous"
              className="w-full h-full"
            />
          </div>

          {/* Name + class badge */}
          <h2
            className="text-5xl font-black uppercase mt-6 tracking-tight"
            style={{ color: theme.primary }}
          >
            {student.name}
          </h2>
          <div
            className="mt-4 px-8 py-2 rounded-full font-bold text-2xl shadow-sm"
            style={{ backgroundColor: theme.primary, color: theme.textMain }}
          >
            Class: {classNameStr}
          </div>
        </div>

        {/* Details panel */}
        <div className="mt-6 mx-4">
          {renderStudentDetails(theme.textSub, "center", false)}
        </div>

        {/* Signature (Positioned near the bottom right to align with the background's red line) */}
        <div className="mt-auto flex justify-end pr-6 pb-6">
          <div className="flex flex-col items-center">
            {school.signatureUrl ? (
              <img
                src={school.signatureUrl}
                alt="Sign"
                crossOrigin="anonymous"
                className="h-14 object-contain mb-1"
              />
            ) : (
              <div className="h-14 mb-1" />
            )}
            {/* We don't need a top border here because the background image already provides a red line for the signature */}
            <div>
              <span 
                className="text-lg font-bold uppercase drop-shadow-sm" 
                style={{ color: "white" }}
              >
                Principal Sign
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  }

  if (layout === 12) {
    return (
      <div
        className="relative box-border overflow-hidden shadow-2xl mx-auto w-168.25 h-271.75 bg-[url('@/assets/id-card-layout-12.jpeg')] bg-cover bg-center bg-no-repeat"
        style={cardContainerStyle}
      >
        <div className={safeZoneClass}>
          {/* School Header Info */}
          <div className="flex flex-col items-center text-center mt-3 relative w-full">
            {/* School Name */}
            <h1
              className="text-4xl font-extrabold uppercase leading-tight drop-shadow-md px-4"
              style={{ color: theme.primary, ...schoolNameStyle }}
            >
              {school.name}
            </h1>

            {/* Sub-header block with Logo absolutely placed on left, details centered */}
            <div className="relative w-full min-h-[140px] mt-4 flex flex-col items-center justify-center px-12">
              {/* Logo */}
              {school.logoUrl && (
                <img
                  src={school.logoUrl}
                  alt="Logo"
                  crossOrigin="anonymous"
                  className="absolute left-4 top-1 w-24 h-24 object-contain bg-white rounded-full p-1 shadow-md z-20"
                />
              )}

              {/* Recognition, Address & Phone (Centered) */}
              <div className="flex flex-col items-center text-center select-none w-full max-w-[420px] mx-auto">
                {school.caption && (
                  <p 
                    className="text-[17px] font-bold text-gray-700 italic leading-tight"
                    style={schoolCaptionStyle}
                  >
                    {school.caption}
                  </p>
                )}
                {school.address && (
                  <p className="text-[18px] font-black text-indigo-900 leading-snug mt-1">
                    {school.address}
                  </p>
                )}
                {school.phone && (
                  <p className="text-[18px] font-black text-indigo-900 leading-snug mt-0.5">
                    Ph.No. {school.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Underlined Document Title */}
            <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-widest underline decoration-2 mt-4 select-none">
              STUDENT ID CARD
            </h2>
          </div>

          {/* Student Photo & Class Card row */}
          <div className="relative w-full h-[250px] mt-6 flex justify-between px-6">
            {/* Student Photo */}
            <div className="w-[220px] h-[220px] rounded-xl border-4 border-white shadow-xl overflow-hidden shrink-0">
              <img
                src={student.profilePictureUrl}
                alt={student.name}
                crossOrigin="anonymous"
                className="w-full h-full object-cover bg-gray-55"
              />
            </div>

            {/* Class Card */}
            <div className="w-[180px] h-[190px] bg-white border-[3px] border-black rounded-xl flex flex-col items-center p-2 select-none">
              <span className="text-xl font-bold uppercase tracking-wider text-gray-800">
                : CLASS :
              </span>
              <span className="text-6xl font-black text-gray-900 mt-4 uppercase">
                {classNameStr}
              </span>
            </div>
          </div>

          {/* Student Name centered in white bar */}
          <div className="absolute left-0 right-0 top-[590px] h-[80px] flex items-center justify-center">
            <h2 className="text-[40px] font-black uppercase text-[#1e3a8a] tracking-wider text-center px-4 leading-none">
              {student.name}
            </h2>
          </div>

          {/* Bottom section (student details & signature) */}
          {/* Student details in white text */}
          <div className="absolute left-10 top-[715px] flex flex-col gap-4 text-[26px] font-black text-white tracking-wide uppercase font-sans text-left">
            <div className="flex gap-2">
              <span className="w-36 opacity-90">F. Name</span>
              <span>:</span>
              <span className="ml-2">{student.fatherName}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-36 opacity-90">Cell</span>
              <span>:</span>
              <span className="ml-2">{student.fatherPhone}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-36 opacity-90">Village</span>
              <span>:</span>
              <span className="ml-2 leading-tight max-w-[260px]">{student.address}</span>
            </div>
          </div>

          {/* Self-scaling signature container inside white oval */}
          <div className="absolute right-10 bottom-12 w-[240px] h-[120px] bg-white rounded-[50%] flex flex-col items-center justify-center p-3 border border-gray-300 shadow-lg overflow-hidden">
            {school.signatureUrl ? (
              <img
                src={school.signatureUrl}
                alt="Signature"
                crossOrigin="anonymous"
                className="max-w-[85%] max-h-[60%] object-contain mb-1"
              />
            ) : (
              <div className="h-10 mb-1" />
            )}
            <span className="text-base font-serif italic font-extrabold text-gray-800 leading-none select-none">
              Signature
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT 11: Floating Inner Card ---
  return (
    <div
      className="relative box-border overflow-hidden shadow-2xl mx-auto"
      style={{ ...cardContainerStyle, backgroundColor: theme.primary }}
    >
      <div className="absolute inset-9 bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col p-6">
        <div className="flex justify-between items-center mb-6 border-b-2 border-gray-100 pb-4">
          <div className="flex flex-col">
            <h1
              className="text-3xl font-black uppercase tracking-tight"
              style={{ color: theme.primary, ...schoolNameStyle }}
            >
              {school.name}
            </h1>
            <p
              className="text-sm font-medium opacity-80"
              style={{ color: theme.textSub }}
            >
              {school.address}
            </p>
          </div>
          <img
            src={school.logoUrl}
            alt="Logo"
            crossOrigin="anonymous"
            className="w-16 h-16 object-contain"
          />
        </div>

        <div className="flex justify-center mb-6">
          <img
            src={student.profilePictureUrl}
            alt={student.name}
            crossOrigin="anonymous"
            className="w-72 h-72"
          />
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center border border-gray-200">
          <h2
            className="text-4xl font-black uppercase mb-2"
            style={{ color: theme.primary }}
          >
            {student.name}
          </h2>
          <p className="text-2xl font-bold" style={{ color: theme.textSub }}>
            Class: <span style={{ color: theme.primary }}>{classNameStr}</span>
          </p>
        </div>

        <div className="grow">{renderStudentDetails(theme.textSub)}</div>

        <div className="mt-6 flex justify-end pt-4 border-t-2 border-gray-100">
          <div className="flex flex-col items-center">
            {school.signatureUrl ? (
              <img
                src={school.signatureUrl}
                alt="Sign"
                crossOrigin="anonymous"
                className="h-10 object-contain mb-1"
              />
            ) : (
              <div className="h-10 mb-1"></div>
            )}
            <span
              className="text-xs font-bold uppercase"
              style={{ color: theme.primary }}
            >
              Principal Sign
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
