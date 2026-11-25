'use client';

import { useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { browserClient } from '../../lib/browser';

const photoTypes = ['image/jpeg', 'image/png', 'image/webp'];
const photoLimit = 2 * 1024 * 1024;
const thumbnailLimit = 1800;
const avatarKey = 'dashboard_avatar';

async function createAvatar(file: File) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const square = Math.min(image.width, image.height);
  try {
    if (!context || !square) throw new Error('Could not read that image.');
    for (const size of [72, 56, 40]) {
      canvas.width = canvas.height = size;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, size, size);
      context.drawImage(image, (image.width - square) / 2, (image.height - square) / 2, square, square, 0, 0, size, size);
      const result = canvas.toDataURL('image/jpeg', .65);
      if (result.length <= thumbnailLimit) return result;
    }
    throw new Error('Could not fit this photo into the avatar. Try a simpler crop.');
  } finally {
    image.close();
  }
}

export function AccountPhoto({ client, initialPhoto, email }: {
  client: ReturnType<typeof browserClient>;
  initialPhoto: unknown;
  email: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [preview, setPreview] = useState(
    typeof initialPhoto === 'string' && initialPhoto.length <= thumbnailLimit && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(initialPhoto) ? initialPhoto : '',
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const initials = email.slice(0, 2).toUpperCase();

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError('');
    const form = event.currentTarget;
    const file = new FormData(form).get('profilePhoto');
    if (!(file instanceof File) || !file.size || !photoTypes.includes(file.type) || file.size > photoLimit) {
      setError('Choose a JPG, PNG, or WebP image up to 2 MB.');
      return;
    }
    setPending(true);
    try {
      const avatar = await createAvatar(file);
      const result = await client.auth.updateUser({ data: { [avatarKey]: avatar } });
      if (result.error) throw result.error;
      setPreview(avatar);
      form.reset();
      dialog.current?.close();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not upload the photo. Try again.');
    } finally {
      setPending(false);
    }
  }

  return <>
    <button type="button" className="avatar account-avatar" aria-label="Change profile photo" title="Change profile photo"
      onClick={() => { setError(''); dialog.current?.showModal(); }}>
      {preview ? <img alt="" src={preview} /> : initials}
    </button>
    <dialog className="modal account-photo-dialog" ref={dialog} aria-labelledby="account-photo-title"
      onCancel={event => { if (pending) event.preventDefault(); }}>
      <form onSubmit={upload}>
        <div className="panel-title">
          <h2 id="account-photo-title">Profile photo</h2>
          <button type="button" className="icon-button" aria-label="Close profile photo" disabled={pending} onClick={() => dialog.current?.close()}><X /></button>
        </div>
        <div className="account-photo-current">
          <span className="avatar account-avatar">{preview ? <img alt="" src={preview} /> : initials}</span>
          <span>{email}</span>
        </div>
        <label className="field">Choose profile photo
          <input type="file" name="profilePhoto" accept={photoTypes.join(',')} required disabled={pending} />
        </label>
        <p className="account-photo-help">JPG, PNG, or WebP up to 2 MB.</p>
        {error && <div className="message error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="button secondary" disabled={pending} onClick={() => dialog.current?.close()}>Cancel</button>
          <button type="submit" className="button primary" disabled={pending}>{pending ? 'Uploading…' : 'Upload photo'}</button>
        </div>
      </form>
    </dialog>
  </>;
}
