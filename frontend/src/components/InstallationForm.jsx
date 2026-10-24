import { useEffect, useRef, useState } from 'react';
import styles from './InstallationForm.module.css';

const STEPS = [
  { number: 1, shortLabel: 'Pelanggan', title: 'Data Pelanggan & Lokasi' },
  { number: 2, shortLabel: 'Teknis', title: 'Perangkat & Sinyal' },
  { number: 3, shortLabel: 'Foto & Kirim', title: 'Foto Bukti & Konfirmasi' },
];

const CUSTOMER_FIELDS = ['name', 'address', 'phone', 'latitude', 'longitude'];
const TECHNICAL_FIELDS = [
  'odp_code',
  'odp_port',
  'ont_sn',
  'ont_mac',
  'stb_sn',
  'stb_mac',
  'rx_optical_power',
  'port_status',
  'vlan_id',
];
const REQUIRED_TECHNICAL_FIELDS = TECHNICAL_FIELDS.filter(
  (field) => field !== 'stb_sn' && field !== 'stb_mac',
);

const PHOTO_CONFIGS = [
  {
    name: 'speedtest_photo',
    label: 'Foto hasil speedtest',
    description: 'Pastikan angka hasil pengujian terlihat jelas.',
  },
  {
    name: 'house_photo',
    label: 'Foto rumah pelanggan',
    description: 'Ambil tampak rumah atau titik pemasangan.',
  },
  {
    name: 'odp_photo',
    label: 'Foto ODP / kabel',
    description: 'Tampilkan ODP, port, atau jalur kabel terpasang.',
  },
  {
    name: 'device_photo',
    label: 'Foto perangkat menyala',
    description: 'Pastikan indikator perangkat terlihat.',
  },
];
const PHOTO_FIELDS = PHOTO_CONFIGS.map(({ name }) => name);
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const FIELD_CONFIGS = {
  customer: [
    {
      name: 'name',
      label: 'Nama pelanggan',
      type: 'text',
      autoComplete: 'name',
      placeholder: 'Contoh: Budi Santoso',
      fullWidth: true,
    },
    {
      name: 'address',
      label: 'Alamat lengkap',
      control: 'textarea',
      autoComplete: 'street-address',
      placeholder: 'Nama jalan, nomor rumah, RT/RW, kelurahan',
      fullWidth: true,
    },
    {
      name: 'phone',
      label: 'No. HP / WhatsApp',
      type: 'tel',
      inputMode: 'tel',
      autoComplete: 'tel',
      placeholder: 'Contoh: 081234567890',
      fullWidth: true,
    },
  ],
  coordinates: [
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      inputMode: 'decimal',
      step: 'any',
      min: '-90',
      max: '90',
      placeholder: '-6.20000000',
    },
    {
      name: 'longitude',
      label: 'Longitude',
      type: 'number',
      inputMode: 'decimal',
      step: 'any',
      min: '-180',
      max: '180',
      placeholder: '106.81666667',
    },
  ],
  technical: [
    {
      name: 'odp_code',
      label: 'Kode ODP',
      type: 'text',
      autoCapitalize: 'characters',
      placeholder: 'Contoh: ODP-JKT-001',
    },
    {
      name: 'odp_port',
      label: 'Nomor port ODP',
      type: 'text',
      inputMode: 'numeric',
      placeholder: 'Contoh: 4',
    },
    {
      name: 'ont_sn',
      label: 'Serial Number ONT',
      type: 'text',
      autoCapitalize: 'characters',
      spellCheck: false,
      placeholder: 'Masukkan SN ONT',
    },
    {
      name: 'ont_mac',
      label: 'MAC Address ONT',
      type: 'text',
      autoCapitalize: 'characters',
      spellCheck: false,
      placeholder: 'Contoh: AA:BB:CC:DD:EE:FF',
    },
    {
      name: 'stb_sn',
      label: 'Serial Number STB',
      optional: true,
      type: 'text',
      autoCapitalize: 'characters',
      spellCheck: false,
      placeholder: 'Kosongkan bila tidak ada STB',
    },
    {
      name: 'stb_mac',
      label: 'MAC Address STB',
      optional: true,
      type: 'text',
      autoCapitalize: 'characters',
      spellCheck: false,
      placeholder: 'Kosongkan bila tidak ada STB',
    },
    {
      name: 'rx_optical_power',
      label: 'Rx Optical Power (dBm)',
      type: 'number',
      inputMode: 'decimal',
      step: 'any',
      placeholder: 'Contoh: -20.50',
    },
    {
      name: 'port_status',
      label: 'Status port',
      control: 'select',
      options: [
        { value: 'active', label: 'Aktif' },
        { value: 'inactive', label: 'Tidak aktif' },
        { value: 'los', label: 'LOS / gangguan sinyal' },
      ],
    },
    {
      name: 'vlan_id',
      label: 'VLAN ID',
      type: 'number',
      inputMode: 'numeric',
      min: '1',
      max: '4094',
      step: '1',
      placeholder: '1–4094',
    },
  ],
};

function createInitialFormData() {
  return {
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    odp_code: '',
    odp_port: '',
    ont_sn: '',
    ont_mac: '',
    stb_sn: '',
    stb_mac: '',
    rx_optical_power: '',
    port_status: '',
    vlan_id: '',
  };
}

function createInitialPhotos() {
  return Object.fromEntries(
    PHOTO_FIELDS.map((name) => [name, { file: null, previewUrl: '' }]),
  );
}

function createInitialDragState() {
  return Object.fromEntries(PHOTO_FIELDS.map((name) => [name, false]));
}

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function validateCustomer(values) {
  const nextErrors = {};

  CUSTOMER_FIELDS.forEach((field) => {
    if (isBlank(values[field])) {
      nextErrors[field] = 'Field ini wajib diisi.';
    }
  });

  if (!isBlank(values.latitude)) {
    const latitude = Number(values.latitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      nextErrors.latitude = 'Latitude harus berupa angka antara -90 dan 90.';
    }
  }

  if (!isBlank(values.longitude)) {
    const longitude = Number(values.longitude);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      nextErrors.longitude = 'Longitude harus berupa angka antara -180 dan 180.';
    }
  }

  return nextErrors;
}

function validateTechnical(values) {
  const nextErrors = {};

  REQUIRED_TECHNICAL_FIELDS.forEach((field) => {
    if (isBlank(values[field])) {
      nextErrors[field] = 'Field ini wajib diisi.';
    }
  });

  if (!isBlank(values.rx_optical_power)) {
    const rxValue = Number(values.rx_optical_power);
    if (!Number.isFinite(rxValue)) {
      nextErrors.rx_optical_power = 'Nilai Rx harus berupa angka, misalnya -20.50.';
    }
  }

  if (!isBlank(values.vlan_id)) {
    const vlanValue = Number(values.vlan_id);
    if (!/^\d+$/.test(values.vlan_id.trim()) || vlanValue < 1 || vlanValue > 4094) {
      nextErrors.vlan_id = 'VLAN ID harus berupa bilangan bulat antara 1 dan 4094.';
    }
  }

  return nextErrors;
}

function validatePhotos(photos) {
  const nextErrors = {};

  PHOTO_FIELDS.forEach((field) => {
    if (!photos[field].file) {
      nextErrors[field] = 'Foto ini wajib diunggah.';
    }
  });

  return nextErrors;
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getApiMessage(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  for (const key of ['message', 'error']) {
    if (typeof payload[key] === 'string' && payload[key].trim()) {
      return payload[key].trim();
    }
  }

  return '';
}

function getPortStatusLabel(value) {
  const option = FIELD_CONFIGS.technical
    .find(({ name }) => name === 'port_status')
    .options.find((item) => item.value === value);

  return option?.label ?? value;
}

function InstallationForm({ apiUrl }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(createInitialFormData);
  const [photos, setPhotos] = useState(createInitialPhotos);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(createInitialDragState);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const fieldRefs = useRef({});
  const sectionHeadingRefs = useRef({});
  const photoActionRefs = useRef({});
  const pickerInputRefs = useRef({});
  const cameraInputRefs = useRef({});
  const previewUrlsRef = useRef({});
  const submittingRef = useRef(false);
  const gpsRequestIdRef = useRef(0);
  const activeGpsRequestRef = useRef(null);

  useEffect(() => {
    return () => {
      gpsRequestIdRef.current += 1;
      activeGpsRequestRef.current = null;

      Object.values(previewUrlsRef.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
      previewUrlsRef.current = {};
    };
  }, []);

  const environmentApiUrl =
    typeof import.meta.env.VITE_API_URL === 'string'
      ? import.meta.env.VITE_API_URL.trim()
      : '';
  const endpoint =
    (typeof apiUrl === 'string' && apiUrl.trim()) ||
    environmentApiUrl ||
    '/api/installations.php';

  function clearErrorsFor(fields) {
    setErrors((previous) => {
      const next = { ...previous };
      fields.forEach((field) => delete next[field]);
      return next;
    });
  }

  function replaceErrorsFor(fields, nextErrors) {
    setErrors((previous) => {
      const next = { ...previous };
      fields.forEach((field) => delete next[field]);
      return { ...next, ...nextErrors };
    });
  }

  function focusField(name, afterStepChange = false) {
    const focusAction = () => {
      const element = fieldRefs.current[name] || photoActionRefs.current[name];
      element?.focus();
    };

    if (afterStepChange) {
      requestAnimationFrame(() => requestAnimationFrame(focusAction));
      return;
    }

    requestAnimationFrame(focusAction);
  }

  function focusSectionHeading(step) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => sectionHeadingRefs.current[step]?.focus());
    });
  }

  function invalidateGpsRequest(feedbackMessage = '') {
    const hadActiveRequest = activeGpsRequestRef.current !== null;
    gpsRequestIdRef.current += 1;
    activeGpsRequestRef.current = null;

    if (!hadActiveRequest) {
      return;
    }

    setGpsLoading(false);
    setGpsFeedback(
      feedbackMessage ? { type: 'info', message: feedbackMessage } : null,
    );
  }

  function updateField(event) {
    const { name, value } = event.target;

    if (name === 'latitude' || name === 'longitude') {
      invalidateGpsRequest(
        'Pencarian GPS dibatalkan karena koordinat dikoreksi secara manual.',
      );
    }

    setFormData((previous) => ({ ...previous, [name]: value }));
    clearErrorsFor([name]);
  }

  function goToNextStep() {
    const fields = currentStep === 1 ? CUSTOMER_FIELDS : TECHNICAL_FIELDS;
    const nextErrors =
      currentStep === 1 ? validateCustomer(formData) : validateTechnical(formData);

    replaceErrorsFor(fields, nextErrors);

    const firstInvalidField = fields.find((field) => nextErrors[field]);
    if (firstInvalidField) {
      focusField(firstInvalidField);
      return;
    }

    if (currentStep === 1) {
      invalidateGpsRequest();
    }

    const nextStep = Math.min(3, currentStep + 1);
    setCurrentStep(nextStep);
    focusSectionHeading(nextStep);
  }

  function goToPreviousStep() {
    const previousStep = Math.max(1, currentStep - 1);
    setCurrentStep(previousStep);
    focusSectionHeading(previousStep);
  }

  function handleGpsRequest() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsFeedback({
        type: 'error',
        message:
          'Perangkat atau browser ini tidak mendukung GPS. Silakan isi koordinat secara manual.',
      });
      return;
    }

    const requestId = gpsRequestIdRef.current + 1;
    gpsRequestIdRef.current = requestId;
    activeGpsRequestRef.current = requestId;
    setGpsLoading(true);
    setGpsFeedback({ type: 'info', message: 'Sedang mencari lokasi dengan akurasi tinggi…' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (activeGpsRequestRef.current !== requestId) {
          return;
        }

        activeGpsRequestRef.current = null;
        const latitude = position.coords.latitude.toFixed(8);
        const longitude = position.coords.longitude.toFixed(8);
        const accuracy = Math.round(position.coords.accuracy);

        setFormData((previous) => ({ ...previous, latitude, longitude }));
        clearErrorsFor(['latitude', 'longitude']);
        setGpsFeedback({
          type: 'success',
          message: `Lokasi ditemukan dengan perkiraan akurasi ${accuracy} meter. Koordinat tetap dapat dikoreksi manual.`,
        });
        setGpsLoading(false);
      },
      (error) => {
        if (activeGpsRequestRef.current !== requestId) {
          return;
        }

        activeGpsRequestRef.current = null;
        const messages = {
          1: 'Izin lokasi ditolak. Aktifkan izin lokasi di browser atau isi koordinat secara manual.',
          2: 'Lokasi belum dapat ditemukan. Coba di area terbuka atau isi koordinat secara manual.',
          3: 'Pencarian lokasi melewati batas waktu. Coba lagi atau isi koordinat secara manual.',
        };

        setGpsFeedback({
          type: 'error',
          message:
            messages[error.code] ||
            'Terjadi kendala saat mengambil lokasi. Silakan coba lagi atau isi secara manual.',
        });
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  }

  function setPhotoError(name, message) {
    setErrors((previous) => ({ ...previous, [name]: message }));
  }

  function resetNativePhotoInputs(name) {
    if (pickerInputRefs.current[name]) {
      pickerInputRefs.current[name].value = '';
    }
    if (cameraInputRefs.current[name]) {
      cameraInputRefs.current[name].value = '';
    }
  }

  function selectPhoto(name, file) {
    if (!file || submittingRef.current) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
      setPhotoError(name, 'Format foto harus JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError(name, 'Ukuran foto maksimal 5 MB. Pilih atau ambil foto yang lebih kecil.');
      return;
    }

    const previousUrl = previewUrlsRef.current[name];
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current[name] = previewUrl;
    setPhotos((previous) => ({
      ...previous,
      [name]: { file, previewUrl },
    }));
    clearErrorsFor([name]);
  }

  function removePhoto(name) {
    const previousUrl = previewUrlsRef.current[name];
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      delete previewUrlsRef.current[name];
    }

    setPhotos((previous) => ({
      ...previous,
      [name]: { file: null, previewUrl: '' },
    }));
    resetNativePhotoInputs(name);
    setPhotoError(name, 'Foto ini wajib diunggah.');
  }

  function updateDragState(name, isActive) {
    setDragActive((previous) => ({ ...previous, [name]: isActive }));
  }

  function handlePhotoDrop(event, name) {
    event.preventDefault();
    updateDragState(name, false);

    if (!submittingRef.current) {
      selectPhoto(name, event.dataTransfer.files?.[0]);
    }
  }

  function revokeAllPreviewUrls() {
    Object.values(previewUrlsRef.current).forEach((url) => {
      URL.revokeObjectURL(url);
    });
    previewUrlsRef.current = {};
  }

  function resetFormAfterSuccess() {
    invalidateGpsRequest();
    revokeAllPreviewUrls();
    PHOTO_FIELDS.forEach(resetNativePhotoInputs);
    setFormData(createInitialFormData());
    setPhotos(createInitialPhotos());
    setErrors({});
    setDragActive(createInitialDragState());
    setGpsFeedback(null);
    setGpsLoading(false);
    setCurrentStep(1);
    focusField('name', true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (currentStep < 3) {
      goToNextStep();
      return;
    }

    if (submittingRef.current) {
      return;
    }

    const customerErrors = validateCustomer(formData);
    const technicalErrors = validateTechnical(formData);
    const photoErrors = validatePhotos(photos);
    const allErrors = { ...customerErrors, ...technicalErrors, ...photoErrors };

    setErrors(allErrors);

    const validationOrder = [...CUSTOMER_FIELDS, ...TECHNICAL_FIELDS, ...PHOTO_FIELDS];
    const firstInvalidField = validationOrder.find((field) => allErrors[field]);

    if (firstInvalidField) {
      const targetStep = CUSTOMER_FIELDS.includes(firstInvalidField)
        ? 1
        : TECHNICAL_FIELDS.includes(firstInvalidField)
          ? 2
          : 3;

      setCurrentStep(targetStep);
      setNotification({
        type: 'error',
        message: 'Periksa kembali field yang ditandai sebelum mengirim laporan.',
      });
      focusField(firstInvalidField, targetStep !== currentStep);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setNotification(null);

    const requestBody = new FormData();
    Object.entries(formData).forEach(([name, value]) => {
      requestBody.append(name, value.trim());
    });
    PHOTO_FIELDS.forEach((name) => {
      requestBody.append(name, photos[name].file);
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: requestBody,
      });

      const responseText = await response.text();
      let responsePayload = null;

      if (responseText) {
        try {
          responsePayload = JSON.parse(responseText);
        } catch {
          responsePayload = null;
        }
      }

      if (!response.ok) {
        const apiMessage = getApiMessage(responsePayload);
        throw new Error(
          apiMessage || `Server menolak pengiriman (HTTP ${response.status}). Silakan coba lagi.`,
        );
      }

      if (
        !responsePayload ||
        typeof responsePayload !== 'object' ||
        Array.isArray(responsePayload)
      ) {
        throw new Error('Server tidak mengembalikan respons JSON yang valid. Silakan coba lagi.');
      }

      if (responsePayload.status !== 'success') {
        throw new Error(
          getApiMessage(responsePayload) ||
            'Server belum mengonfirmasi bahwa laporan berhasil disimpan. Data tetap tersedia untuk dicoba kembali.',
        );
      }

      const successMessage =
        getApiMessage(responsePayload) || 'Laporan pemasangan berhasil dikirim.';
      resetFormAfterSuccess();
      setNotification({ type: 'success', message: successMessage });
    } catch (error) {
      const message =
        error instanceof TypeError
          ? 'Tidak dapat terhubung ke server. Periksa koneksi dan alamat API, lalu coba lagi.'
          : error instanceof Error && error.message
            ? error.message
            : 'Pengiriman gagal. Silakan coba lagi.';

      setNotification({ type: 'error', message });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function renderField(config) {
    const {
      name,
      label,
      optional = false,
      control = 'input',
      fullWidth = false,
      options = [],
      ...inputProps
    } = config;
    const errorId = `${name}-error`;
    const commonProps = {
      id: name,
      name,
      value: formData[name],
      onChange: updateField,
      required: !optional,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? errorId : undefined,
      ref: (node) => {
        fieldRefs.current[name] = node;
      },
    };

    let fieldControl;
    if (control === 'textarea') {
      fieldControl = <textarea {...commonProps} {...inputProps} rows="4" />;
    } else if (control === 'select') {
      fieldControl = (
        <select {...commonProps}>
          <option value="">Pilih status port</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    } else {
      fieldControl = <input {...commonProps} {...inputProps} />;
    }

    return (
      <div
        className={`${styles.field} ${fullWidth ? styles.fullWidth : ''}`}
        key={name}
      >
        <label htmlFor={name}>
          {label}{' '}
          {optional ? (
            <span className={styles.optional}>(opsional)</span>
          ) : (
            <span className={styles.requiredMark} aria-hidden="true">
              *
            </span>
          )}
        </label>
        {fieldControl}
        {errors[name] && (
          <p className={styles.fieldError} id={errorId} role="alert">
            {errors[name]}
          </p>
        )}
      </div>
    );
  }

  function renderPhotoCard(config) {
    const { name, label, description } = config;
    const photo = photos[name];
    const labelId = `${name}-label`;
    const errorId = `${name}-error`;
    const descriptionId = `${name}-description`;

    return (
      <article
        className={`${styles.photoCard} ${dragActive[name] ? styles.photoCardDragging : ''}`}
        key={name}
        aria-labelledby={labelId}
        aria-describedby={`${descriptionId}${errors[name] ? ` ${errorId}` : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!submittingRef.current) updateDragState(name, true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!submittingRef.current) updateDragState(name, true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            updateDragState(name, false);
          }
        }}
        onDrop={(event) => handlePhotoDrop(event, name)}
      >
        <div className={styles.photoCardHeader}>
          <div>
            <h3 id={labelId}>
              {label} <span aria-hidden="true">*</span>
            </h3>
            <p id={descriptionId}>{description}</p>
          </div>
          {photo.file && <span className={styles.readyBadge}>Siap</span>}
        </div>

        <input
          className={styles.visuallyHiddenFile}
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          aria-label={`Pilih ${label.toLowerCase()} dari perangkat`}
          ref={(node) => {
            pickerInputRefs.current[name] = node;
          }}
          disabled={submitting}
          onChange={(event) => {
            selectPhoto(name, event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <input
          className={styles.visuallyHiddenFile}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          aria-label={`Ambil ${label.toLowerCase()} dengan kamera`}
          ref={(node) => {
            cameraInputRefs.current[name] = node;
          }}
          disabled={submitting}
          onChange={(event) => {
            selectPhoto(name, event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        {photo.file ? (
          <div className={styles.photoPreview}>
            <img src={photo.previewUrl} alt={`Pratinjau ${label.toLowerCase()}`} />
            <div className={styles.photoMetadata}>
              <strong title={photo.file.name}>{photo.file.name}</strong>
              <span>{formatFileSize(photo.file.size)}</span>
            </div>
          </div>
        ) : (
          <div className={styles.emptyPhotoState} aria-hidden="true">
            <span className={styles.cameraIcon}>＋</span>
            <span>Seret gambar ke kartu ini</span>
            <small>Maksimal 5 MB</small>
          </div>
        )}

        <div className={styles.photoActions}>
          <button
            className={styles.photoButton}
            type="button"
            ref={(node) => {
              photoActionRefs.current[name] = node;
            }}
            onClick={() => pickerInputRefs.current[name]?.click()}
            disabled={submitting}
          >
            {photo.file ? 'Ganti foto' : 'Pilih foto'}
          </button>
          <button
            className={styles.photoButton}
            type="button"
            onClick={() => cameraInputRefs.current[name]?.click()}
            disabled={submitting}
          >
            {photo.file ? 'Ambil ulang' : 'Buka kamera'}
          </button>
          {photo.file && (
            <button
              className={styles.removeButton}
              type="button"
              onClick={() => removePhoto(name)}
              disabled={submitting}
            >
              Hapus
            </button>
          )}
        </div>

        {errors[name] && (
          <p className={styles.fieldError} id={errorId} role="alert">
            {errors[name]}
          </p>
        )}
      </article>
    );
  }

  return (
    <div className={styles.formShell}>
      {notification && (
        <div
          className={`${styles.toast} ${
            notification.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      <form
        className={styles.formCard}
        onSubmit={handleSubmit}
        noValidate
        aria-label="Form pemasangan baru"
        aria-busy={submitting}
      >
        <nav className={styles.stepper} aria-label="Tahap formulir">
          <ol>
            {STEPS.map((step) => {
              const isActive = currentStep === step.number;
              const isComplete = currentStep > step.number;
              return (
                <li
                  className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${
                    isComplete ? styles.stepComplete : ''
                  }`}
                  key={step.number}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className={styles.stepNumber} aria-hidden="true">
                    {isComplete ? '✓' : step.number}
                  </span>
                  <span className={styles.stepLabel}>{step.shortLabel}</span>
                </li>
              );
            })}
          </ol>
        </nav>

        <fieldset className={styles.contentFieldset} disabled={submitting}>
          {currentStep === 1 && (
            <section className={styles.formSection} aria-labelledby="customer-step-title">
              <div className={styles.sectionIntro}>
                <p>Tahap 1 dari 3</p>
                <h2
                  id="customer-step-title"
                  tabIndex="-1"
                  ref={(node) => {
                    sectionHeadingRefs.current[1] = node;
                  }}
                >
                  Data Pelanggan & Lokasi
                </h2>
                <span>Isi identitas pelanggan dan titik pemasangan.</span>
              </div>

              <div className={styles.fieldGrid}>
                {FIELD_CONFIGS.customer.map(renderField)}

                <div className={`${styles.gpsPanel} ${styles.fullWidth}`}>
                  <div>
                    <strong>Koordinat lokasi</strong>
                    <p>Gunakan GPS atau isi dan koreksi koordinat secara manual.</p>
                  </div>
                  <button
                    className={styles.gpsButton}
                    type="button"
                    onClick={handleGpsRequest}
                    disabled={gpsLoading || submitting}
                    aria-busy={gpsLoading}
                  >
                    {gpsLoading && <span className={styles.spinner} aria-hidden="true" />}
                    {gpsLoading ? 'Mencari lokasi…' : 'Ambil lokasi GPS'}
                  </button>
                  {gpsFeedback && (
                    <p
                      className={`${styles.gpsFeedback} ${
                        gpsFeedback.type === 'error' ? styles.gpsFeedbackError : ''
                      }`}
                      role={gpsFeedback.type === 'error' ? 'alert' : 'status'}
                      aria-live="polite"
                    >
                      {gpsFeedback.message}
                    </p>
                  )}
                </div>

                {FIELD_CONFIGS.coordinates.map(renderField)}

                {!isBlank(formData.latitude) && !isBlank(formData.longitude) && (
                  <output className={`${styles.coordinateOutput} ${styles.fullWidth}`}>
                    <span>Koordinat saat ini</span>
                    <strong>
                      {formData.latitude}, {formData.longitude}
                    </strong>
                  </output>
                )}
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section className={styles.formSection} aria-labelledby="technical-step-title">
              <div className={styles.sectionIntro}>
                <p>Tahap 2 dari 3</p>
                <h2
                  id="technical-step-title"
                  tabIndex="-1"
                  ref={(node) => {
                    sectionHeadingRefs.current[2] = node;
                  }}
                >
                  Perangkat & Sinyal
                </h2>
                <span>Catat perangkat dan hasil pengukuran setelah pemasangan.</span>
              </div>

              <div className={styles.fieldGrid}>
                {FIELD_CONFIGS.technical.map(renderField)}
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section className={styles.formSection} aria-labelledby="photo-step-title">
              <div className={styles.sectionIntro}>
                <p>Tahap 3 dari 3</p>
                <h2
                  id="photo-step-title"
                  tabIndex="-1"
                  ref={(node) => {
                    sectionHeadingRefs.current[3] = node;
                  }}
                >
                  Foto Bukti & Konfirmasi
                </h2>
                <span>Unggah empat foto wajib, lalu periksa ringkasan sebelum dikirim.</span>
              </div>

              <div className={styles.photoGrid}>{PHOTO_CONFIGS.map(renderPhotoCard)}</div>

              <section className={styles.summary} aria-labelledby="summary-title">
                <div className={styles.summaryHeader}>
                  <p>Konfirmasi</p>
                  <h3 id="summary-title">Ringkasan pemasangan</h3>
                </div>

                <div className={styles.summaryGrid}>
                  <div className={styles.summaryGroup}>
                    <h4>Pelanggan & lokasi</h4>
                    <dl>
                      <div>
                        <dt>Nama</dt>
                        <dd>{formData.name || '—'}</dd>
                      </div>
                      <div>
                        <dt>Alamat</dt>
                        <dd>{formData.address || '—'}</dd>
                      </div>
                      <div>
                        <dt>No. HP / WhatsApp</dt>
                        <dd>{formData.phone || '—'}</dd>
                      </div>
                      <div>
                        <dt>Koordinat</dt>
                        <dd>
                          {formData.latitude && formData.longitude
                            ? `${formData.latitude}, ${formData.longitude}`
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className={styles.summaryGroup}>
                    <h4>Jaringan & perangkat</h4>
                    <dl>
                      <div>
                        <dt>ODP / port</dt>
                        <dd>{`${formData.odp_code || '—'} / ${formData.odp_port || '—'}`}</dd>
                      </div>
                      <div>
                        <dt>ONT SN / MAC</dt>
                        <dd>{`${formData.ont_sn || '—'} / ${formData.ont_mac || '—'}`}</dd>
                      </div>
                      <div>
                        <dt>STB SN / MAC</dt>
                        <dd>{`${formData.stb_sn || '—'} / ${formData.stb_mac || '—'}`}</dd>
                      </div>
                      <div>
                        <dt>Rx / status / VLAN</dt>
                        <dd>
                          {`${formData.rx_optical_power || '—'} dBm / ${
                            getPortStatusLabel(formData.port_status) || '—'
                          } / ${formData.vlan_id || '—'}`}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className={styles.photoSummary}>
                  <h4>Status foto bukti</h4>
                  <ul>
                    {PHOTO_CONFIGS.map(({ name, label }) => (
                      <li key={name}>
                        <span aria-hidden="true">{photos[name].file ? '✓' : '!'}</span>
                        <div>
                          <strong>{label}</strong>
                          <small>
                            {photos[name].file
                              ? `${photos[name].file.name} · ${formatFileSize(
                                  photos[name].file.size,
                                )}`
                              : 'Belum dipilih'}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className={styles.confirmationNote}>
                  Pastikan data dan foto sudah benar. Laporan akan langsung dikirim ke sistem.
                </p>
              </section>
            </section>
          )}
        </fieldset>

        <div className={styles.actions}>
          {currentStep > 1 ? (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={goToPreviousStep}
              disabled={submitting}
            >
              Sebelumnya
            </button>
          ) : (
            <span aria-hidden="true" />
          )}

          {currentStep < 3 ? (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={goToNextStep}
              disabled={submitting}
            >
              Lanjut
            </button>
          ) : (
            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              {submitting && <span className={styles.spinner} aria-hidden="true" />}
              {submitting ? 'Mengirim laporan…' : 'Kirim laporan'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default InstallationForm;
