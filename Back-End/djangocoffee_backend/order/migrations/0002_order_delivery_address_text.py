from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('order', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='delivery_address_text',
            field=models.TextField(blank=True, help_text='Alamat pengiriman dalam bentuk teks', null=True),
        ),
    ] 