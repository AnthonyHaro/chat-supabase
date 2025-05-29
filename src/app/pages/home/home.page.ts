import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { supabase } from 'src/app/supabase.client';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  email = '';
  messages: any[] = [];
  newMessage = '';
  private messageSubscription: any;

  constructor(private router: Router) {}

  async ngOnInit() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      this.router.navigate(['/auth']);
      return;
    }

    this.email = data.user.email || '';
    await this.loadMessages();
    this.subscribeToMessages();
  }

  ngOnDestroy() {
    this.messageSubscription?.unsubscribe();
  }

  async loadMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error) {
      this.messages = data || [];
    }
  }

  subscribeToMessages() {
    this.messageSubscription = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          this.messages.push(payload.new);
        }
      )
      .subscribe();
  }

  async sendMessage() {
    const content = this.newMessage.trim();
    if (!content) return;

    await supabase.from('messages').insert({
      email: this.email,
      content,
    });

    this.newMessage = '';
  }

  async logout() {
    await supabase.auth.signOut();
    this.router.navigate(['/auth']);
  }
}